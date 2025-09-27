const { PublicKey, AccountId } = require('@hashgraph/sdk');
const crypto = require('crypto');

/**
 * Wallet Authentication Middleware
 * Verifies wallet signatures for EcoRide platform requests
 */

class WalletAuthMiddleware {
    constructor() {
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.activeSessions = new Map();
        this.nonceStore = new Map();
    }

    /**
     * Generate a nonce for wallet signature challenge
     */
    generateNonce() {
        const timestamp = Date.now();
        const randomBytes = crypto.randomBytes(16).toString('hex');
        return `${timestamp}-${randomBytes}`;
    }

    /**
     * Create authentication challenge for wallet
     */
    async createChallenge(req, res, next) {
        try {
            const { accountId } = req.body;

            if (!accountId) {
                return res.status(400).json({
                    success: false,
                    error: 'Account ID is required'
                });
            }

            // Validate account ID format
            try {
                AccountId.fromString(accountId);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid account ID format'
                });
            }

            const nonce = this.generateNonce();
            const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes to complete challenge

            // Store nonce with expiration
            this.nonceStore.set(nonce, {
                accountId,
                expiresAt,
                used: false
            });

            // Clean up expired nonces
            this.cleanupExpiredNonces();

            const challenge = {
                nonce,
                message: `EcoRide Authentication\nAccount: ${accountId}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`,
                expiresAt
            };

            res.json({
                success: true,
                data: challenge,
                instructions: {
                    message: 'Sign the provided message with your wallet private key',
                    note: 'This challenge expires in 5 minutes'
                }
            });

        } catch (error) {
            console.error('Challenge creation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create authentication challenge'
            });
        }
    }

    /**
     * Verify wallet signature and create session
     */
    async verifySignature(req, res, next) {
        try {
            const { accountId, nonce, signature, publicKey } = req.body;

            if (!accountId || !nonce || !signature || !publicKey) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: accountId, nonce, signature, publicKey'
                });
            }

            // Check if nonce exists and is valid
            const nonceData = this.nonceStore.get(nonce);
            if (!nonceData) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid or expired nonce'
                });
            }

            if (nonceData.used) {
                return res.status(400).json({
                    success: false,
                    error: 'Nonce already used'
                });
            }

            if (Date.now() > nonceData.expiresAt) {
                this.nonceStore.delete(nonce);
                return res.status(400).json({
                    success: false,
                    error: 'Challenge expired'
                });
            }

            if (nonceData.accountId !== accountId) {
                return res.status(400).json({
                    success: false,
                    error: 'Account ID mismatch'
                });
            }

            // Reconstruct the original message
            const message = `EcoRide Authentication\nAccount: ${accountId}\nNonce: ${nonce}\nTimestamp: ${nonce.split('-')[0]}`;

            // Verify signature
            try {
                const pubKey = PublicKey.fromString(publicKey);
                const messageBytes = Buffer.from(message, 'utf8');
                const signatureBytes = Buffer.from(signature, 'hex');

                const isValid = pubKey.verify(messageBytes, signatureBytes);

                if (!isValid) {
                    return res.status(401).json({
                        success: false,
                        error: 'Invalid signature'
                    });
                }

            } catch (error) {
                console.error('Signature verification error:', error);
                return res.status(401).json({
                    success: false,
                    error: 'Signature verification failed'
                });
            }

            // Mark nonce as used
            nonceData.used = true;

            // Create session
            const sessionToken = crypto.randomBytes(32).toString('hex');
            const sessionData = {
                accountId,
                publicKey,
                createdAt: Date.now(),
                expiresAt: Date.now() + this.sessionTimeout,
                lastActivity: Date.now()
            };

            this.activeSessions.set(sessionToken, sessionData);

            // Clean up expired sessions
            this.cleanupExpiredSessions();

            res.json({
                success: true,
                data: {
                    sessionToken,
                    accountId,
                    expiresAt: sessionData.expiresAt
                },
                message: 'Authentication successful'
            });

        } catch (error) {
            console.error('Signature verification error:', error);
            res.status(500).json({
                success: false,
                error: 'Authentication failed'
            });
        }
    }

    /**
     * Middleware to authenticate requests using session token
     */
    async authenticateRequest(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            const sessionToken = authHeader && authHeader.startsWith('Bearer ')
                ? authHeader.substring(7)
                : req.headers['x-session-token'];

            if (!sessionToken) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            const sessionData = this.activeSessions.get(sessionToken);
            if (!sessionData) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid session token'
                });
            }

            if (Date.now() > sessionData.expiresAt) {
                this.activeSessions.delete(sessionToken);
                return res.status(401).json({
                    success: false,
                    error: 'Session expired'
                });
            }

            // Update last activity
            sessionData.lastActivity = Date.now();

            // Add user info to request
            req.user = {
                accountId: sessionData.accountId,
                publicKey: sessionData.publicKey,
                sessionToken
            };

            next();

        } catch (error) {
            console.error('Request authentication error:', error);
            res.status(500).json({
                success: false,
                error: 'Authentication error'
            });
        }
    }

    /**
     * Optional authentication - adds user info if authenticated but doesn't require it
     */
    async optionalAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            const sessionToken = authHeader && authHeader.startsWith('Bearer ')
                ? authHeader.substring(7)
                : req.headers['x-session-token'];

            if (sessionToken) {
                const sessionData = this.activeSessions.get(sessionToken);
                if (sessionData && Date.now() <= sessionData.expiresAt) {
                    sessionData.lastActivity = Date.now();
                    req.user = {
                        accountId: sessionData.accountId,
                        publicKey: sessionData.publicKey,
                        sessionToken
                    };
                }
            }

            next();

        } catch (error) {
            console.error('Optional auth error:', error);
            next(); // Continue even if auth fails
        }
    }

    /**
     * Logout and invalidate session
     */
    async logout(req, res, next) {
        try {
            const sessionToken = req.user?.sessionToken;

            if (sessionToken) {
                this.activeSessions.delete(sessionToken);
            }

            res.json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                error: 'Logout failed'
            });
        }
    }

    /**
     * Get session info
     */
    async getSessionInfo(req, res, next) {
        try {
            const sessionData = this.activeSessions.get(req.user.sessionToken);

            res.json({
                success: true,
                data: {
                    accountId: sessionData.accountId,
                    createdAt: sessionData.createdAt,
                    expiresAt: sessionData.expiresAt,
                    lastActivity: sessionData.lastActivity
                }
            });

        } catch (error) {
            console.error('Session info error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get session info'
            });
        }
    }

    /**
     * Clean up expired nonces
     */
    cleanupExpiredNonces() {
        const now = Date.now();
        for (const [nonce, data] of this.nonceStore.entries()) {
            if (now > data.expiresAt) {
                this.nonceStore.delete(nonce);
            }
        }
    }

    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        for (const [token, data] of this.activeSessions.entries()) {
            if (now > data.expiresAt) {
                this.activeSessions.delete(token);
            }
        }
    }

    /**
     * Get statistics about active sessions and nonces
     */
    getStats() {
        this.cleanupExpiredSessions();
        this.cleanupExpiredNonces();

        return {
            activeSessions: this.activeSessions.size,
            pendingNonces: this.nonceStore.size,
            sessionTimeout: this.sessionTimeout
        };
    }
}

// Create singleton instance
const walletAuth = new WalletAuthMiddleware();

// Export middleware functions
module.exports = {
    walletAuth,
    createChallenge: walletAuth.createChallenge.bind(walletAuth),
    verifySignature: walletAuth.verifySignature.bind(walletAuth),
    authenticateRequest: walletAuth.authenticateRequest.bind(walletAuth),
    optionalAuth: walletAuth.optionalAuth.bind(walletAuth),
    logout: walletAuth.logout.bind(walletAuth),
    getSessionInfo: walletAuth.getSessionInfo.bind(walletAuth)
};