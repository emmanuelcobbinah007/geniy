const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const { PrismaClient, MemberRole } = require('@prisma/client');
const prisma = new PrismaClient();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Helper to get user with workspaces
const getUserWithWorkspaces = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            workspaces: true, // Owned workspaces
            memberships: {
                include: {
                    workspace: true // Shared workspaces
                }
            }
        }
    });

    if (!user) return null;

    // Segregate workspaces
    const ownedWorkspaces = user.workspaces;
    const sharedWorkspaces = user.memberships
        .filter(m => m.role !== 'OWNER') // Filter out owned ones just in case, though schema relates owner differently
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
const googleAuth = async (req, res) => {
    const { token } = req.body;

    try {
        // Verify Access Token by fetching user info
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const { name, email, sub } = response.data;

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Create new user
            // Generate a random password for Google users
            const randomPassword = Math.random().toString(36).slice(-8);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            user = await prisma.$transaction(async (prisma) => {
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

                return newUser;
            });
        }

        const userData = await getUserWithWorkspaces(user.id);

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            workspaces: userData.workspaces,
            sharedWorkspaces: userData.sharedWorkspaces,
            token: generateToken(user.id),
        });
    } catch (error) {
        console.error('Google Auth Error:', error.response?.data || error.message);
        res.status(400).json({ message: 'Google authentication failed' });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    // req.user is already populated by authMiddleware, but let's ensure structure matches
    // We might need to update authMiddleware too, but for now let's rely on what's passed or refetch if needed
    // Ideally authMiddleware does the heavy lifting.
    // Let's check authMiddleware next.
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

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                name: user.name,
                email: user.email,
                passwordHash: user.passwordHash
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
    getMe,
    updateUser,
};
