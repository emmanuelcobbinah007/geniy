const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { PrismaClient, MemberRole } = require('@prisma/client');
const prisma = new PrismaClient();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
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
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
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
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
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
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, sub } = ticket.getPayload();

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

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user.id),
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Google authentication failed' });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

module.exports = {
    signup,
    signin,
    googleAuth,
    getMe,
};
