const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                include: {
                    workspaces: true,
                    memberships: {
                        include: {
                            workspace: true
                        }
                    }
                }
            });

            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Segregate workspaces
            const ownedWorkspaces = user.workspaces;
            const sharedWorkspaces = user.memberships
                .filter(m => m.role !== 'OWNER')
                .map(m => m.workspace);

            req.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                workspaces: ownedWorkspaces,
                sharedWorkspaces
            };

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
