const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const { MemberRole } = require('@prisma/client'); // Keep MemberRole
const prisma = require('../config/db'); // Use singleton Prisma client

const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage'
);

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Helper to get user with workspaces (LITE VERSION for faster login)
const getUserWithWorkspaces = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            workspaces: {
                select: {
                    id: true,
                    name: true,
                    ownerId: true,
                    planTier: true,
                    // EXCLUDING: businessContext, competitors, gapAnalysis (Heavy fields)
                }
            }, // Owned workspaces
            memberships: {
                include: {
                    workspace: {
                        select: {
                            id: true,
                            name: true,
                            ownerId: true,
                            planTier: true,
                            // EXCLUDING heavy fields here too
                        }
                    } // Shared workspaces
                }
            }
        }
    });

    if (!user) return null;

    // Segregate workspaces
    const ownedWorkspaces = user.workspaces;
    const sharedWorkspaces = user.memberships
        .filter(m => m.role !== 'OWNER') // Filter out owned ones just in case
        .map(m => m.workspace);

    return {
        ...user,
        workspaces: ownedWorkspaces,
        sharedWorkspaces
    };
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
    const { name, email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please add all fields' });
    }

    try {
        // Check if user exists
        const userExists = await prisma.user.findUnique({
            where: { email },
        });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user and default workspace transactionally
        const user = await prisma.$transaction(async (prisma) => {
            // 1. Create User
            const newUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    passwordHash: hashedPassword,
                },
            });

            // 2. Create Default Workspace
            const workspace = await prisma.workspace.create({
                data: {
                    name: `${name}'s Workspace`,
                    ownerId: newUser.id,
                },
            });

            // 3. Create Workspace Member (Owner)
            await prisma.workspaceMember.create({
                data: {
                    userId: newUser.id,
                    workspaceId: workspace.id,
                    role: MemberRole.OWNER,
                },
            });

            // 4. Create Default Free Subscription
            await prisma.subscription.create({
                data: {
                    workspaceId: workspace.id,
                    planTier: 'FREE',
                    status: 'active',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 100)), // Forever
                }
            });

            return newUser;
        });

        if (user) {
            const userData = await getUserWithWorkspaces(user.id);

            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                workspaces: userData.workspaces,
                sharedWorkspaces: userData.sharedWorkspaces,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/signin
// @access  Public
const signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check for user email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            const userData = await getUserWithWorkspaces(user.id);

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                workspaces: userData.workspaces,
                sharedWorkspaces: userData.sharedWorkspaces,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Google Auth
// @route   POST /api/auth/google
// @access  Public
const completeGoogleSignup = async (req, res) => {
    console.log("🔥 completeGoogleSignup HIT. Body:", req.body);

    if (!req.body || !req.body.googleUser) {
        console.error("Missing req.body or googleUser in body");
        return res.status(400).json({ message: 'Invalid request: Missing googleUser' });
    }

    const { googleUser, planTier, paymentReference } = req.body;

    if (!googleUser) {
        return res.status(400).json({ message: 'Invalid user data' });
    }

    const { email, name } = googleUser;

    if (!email || !name) {
        console.error("Invalid googleUser data (no email or name):", googleUser);
        return res.status(400).json({ message: 'Invalid user data' });
    }

    try {
        console.log("Checking existing user:", email);
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            console.log("User already exists, logging in:", userExists.id);
            // Should not happen if flow is correct, but handle gracefully by logging in
            const userData = await getUserWithWorkspaces(userExists.id);
            return res.json({
                _id: userExists.id,
                name: userExists.name,
                email: userExists.email,
                workspaces: userData.workspaces,
                sharedWorkspaces: userData.sharedWorkspaces,
                token: generateToken(userExists.id),
            });
        }

        const hashedPassword = "GOOGLE_AUTH_USER_NO_PASSWORD";

        console.log("Starting Transaction for:", email);
        // Transactional Creation
        const user = await prisma.$transaction(async (prisma) => {
            // 1. Create User (Double-check inside transaction for race conditions)
            console.log(" Creating User...");
            let newUser = await prisma.user.findUnique({ where: { email } });

            // If user still doesn't exist, try to create. 
            // If race condition happens here, P2002 will be thrown and caught below.
            if (!newUser) {
                newUser = await prisma.user.create({
                    data: { name, email, passwordHash: hashedPassword },
                });
            } else {
                console.log(" User found inside transaction (race condition handled PRE-CREATE).");
            }

            // 2. Create Default Workspace
            console.log(" Creating Workspace...");
            const workspace = await prisma.workspace.create({
                data: {
                    name: `${name}'s Workspace`,
                    ownerId: newUser.id,
                    planTier: planTier === 'FREE' ? 'FREE' : (planTier || 'FREE'),
                },
            });

            // 3. Create Workspace Member (Owner)
            console.log(" Creating Member...");
            // Ensure MemberRole is defined
            if (!MemberRole || !MemberRole.OWNER) {
                throw new Error("MemberRole is undefined! Check imports.");
            }
            await prisma.workspaceMember.create({
                data: {
                    userId: newUser.id,
                    workspaceId: workspace.id,
                    role: MemberRole.OWNER,
                },
            });

            // 4. Create Subscription
            console.log(" Creating Subscription...");
            await prisma.subscription.create({
                data: {
                    workspaceId: workspace.id,
                    planTier: planTier === 'FREE' ? 'FREE' : (planTier || 'FREE'),
                    status: 'active',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 100)), // Forever
                    paystackSubscriptionCode: paymentReference || null
                }
            });

            // 5. If Paid, Verify & Create Transaction Record
            if (planTier !== 'FREE' && paymentReference) {
                console.log(" Verifying Payment with Paystack:", paymentReference);

                // Server-side Verification
                const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${paymentReference}`, {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_PUBLIC_KEY}` // Fallback if secret missing (not ideal but better than crash)
                    }
                });
                const verifyData = await verifyRes.json();

                if (!verifyData.status || verifyData.data.status !== 'success') {
                    console.error("Payment Verification Failed:", verifyData);
                    throw new Error("Payment verification failed! Ref: " + paymentReference);
                }

                console.log(" Payment Verified! Creating Transaction Record...");
                await prisma.transaction.create({
                    data: {
                        workspaceId: workspace.id,
                        amount: verifyData.data.amount / 100, // Convert kobo to GHS
                        currency: verifyData.data.currency,
                        status: 'COMPLETED',
                        reference: paymentReference,
                        planTier: planTier
                    }
                });
            }

            return newUser;
        }, {
            timeout: 20000
        });

        console.log("Transaction Complete. User created:", user.id);
        const userData = await getUserWithWorkspaces(user.id);

        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            workspaces: userData.workspaces,
            sharedWorkspaces: userData.sharedWorkspaces,
            token: generateToken(user.id),
        });

    } catch (error) {
        console.error("Complete Signup Error:", error);

        // RACE CONDITION HANDLING (P2002 on Email)
        if (error.code === 'P2002' && (error.meta?.target?.includes('email') || error.message.includes('email'))) {
            console.log("Race condition detected (User created in parallel). Attempting login...");
            try {
                const existingUser = await prisma.user.findUnique({ where: { email } });
                if (existingUser) {
                    const userData = await getUserWithWorkspaces(existingUser.id);
                    return res.json({
                        _id: existingUser.id,
                        name: existingUser.name,
                        email: existingUser.email,
                        workspaces: userData.workspaces,
                        sharedWorkspaces: userData.sharedWorkspaces,
                        token: generateToken(existingUser.id),
                    });
                }
            } catch (loginError) {
                console.error("Secondary Login Error:", loginError);
            }
        }

        // Sanitize Error for Client
        let userMessage = "Account setup failed. Please try again or contact support.";

        // Handle specific known errors with friendlier messages
        if (error.code === 'P2002') {
            userMessage = "An account with this email already exists. Please log in.";
        } else if (error.message && error.message.includes('Payment verification failed')) {
            userMessage = "We could not verify your payment. Please contact support with your reference.";
        } else if (error.message && error.message.includes('timeout')) {
            userMessage = "The system is busy. Please refresh and try verifying again.";
        }

        res.status(500).json({ message: userMessage, debug: null }); // Don't send stack trace to client
    }
};

// @desc    Google Auth (Step 1: Verify & Check Existence)
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
    const { code } = req.body;

    console.log("GOOGLE AUTH ATTEMPT");

    try {
        console.time("GoogleAuth_Total");

        // Exchange code for tokens
        const { tokens } = await client.getToken({
            code,
            redirect_uri: 'postmessage'
        });

        // Verify ID Token
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, sub } = ticket.getPayload();

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email },
        });

        console.timeEnd("GoogleAuth_Total");

        if (user) {
            // Login existing user
            const userData = await getUserWithWorkspaces(user.id);
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                workspaces: userData.workspaces,
                sharedWorkspaces: userData.sharedWorkspaces,
                token: generateToken(user.id),
            });
        } else {
            // Return PENDING status for new user
            // Do NOT create user in DB yet
            res.json({
                status: 'PENDING',
                googleUser: {
                    name,
                    email,
                    tokens // Optional: Might not need to send tokens back if not needed for subsequent calls, but good for re-verification if implemented
                }
            });
        }

    } catch (error) {
        console.error('Google Auth Generic Error:', error.message);
        res.status(400).json({
            message: 'Google authentication failed',
            details: error.message
        });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateUser = async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(req.body.password, salt);
        }

        if (req.body.onboardingStatus) {
            const currentStatus = user.onboardingStatus || {};
            user.onboardingStatus = { ...currentStatus, ...req.body.onboardingStatus };
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                name: user.name,
                email: user.email,
                passwordHash: user.passwordHash,
                onboardingStatus: user.onboardingStatus
            }
        });

        const userData = await getUserWithWorkspaces(updatedUser.id);

        res.json({
            _id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            workspaces: userData.workspaces,
            sharedWorkspaces: userData.sharedWorkspaces,
            token: generateToken(updatedUser.id),
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = {
    signup,
    signin,
    googleAuth,
    completeGoogleSignup,
    getMe,
    updateUser,
};
