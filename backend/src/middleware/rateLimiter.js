const rateLimit = require('express-rate-limit');
const { createHash } = require('crypto');

/**
 * Rate Limiting and Security Middleware for EcoRide API
 */

// General API rate limiter
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req) => {
        // Use IP + User-Agent for more specific rate limiting
        const identifier = req.ip + req.get('User-Agent');
        return createHash('sha256').update(identifier).digest('hex');
    },
    skip: (req) => {
        // Skip rate limiting for health checks and info endpoints
        return req.path === '/api/hedera/health' || req.path === '/api/hedera/info';
    },
    handler: (req, res) => {
        console.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
        res.status(429).json({
            success: false,
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

// Strict rate limiter for sensitive operations
const strictLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // limit each IP to 10 requests per 5 minutes
    message: {
        success: false,
        error: 'Too many sensitive operations from this IP, please try again later.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // For authenticated requests, use account ID + IP
        if (req.user?.accountId) {
            return createHash('sha256').update(req.user.accountId + req.ip).digest('hex');
        }
        return createHash('sha256').update(req.ip + req.get('User-Agent')).digest('hex');
    },
    handler: (req, res) => {
        console.warn(`Strict rate limit exceeded for IP: ${req.ip}, User: ${req.user?.accountId || 'anonymous'}, Path: ${req.path}`);
        res.status(429).json({
            success: false,
            error: 'Too many sensitive operations from this IP, please try again later.',
            retryAfter: '5 minutes'
        });
    }
});

// Journey submission rate limiter (prevent spam)
const journeyLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each user to 5 journey submissions per minute
    message: {
        success: false,
        error: 'Too many journey submissions, please wait before submitting another journey.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use account ID for authenticated users, IP for others
        if (req.user?.accountId) {
            return `journey_${req.user.accountId}`;
        }
        return `journey_ip_${req.ip}`;
    },
    skip: (req) => {
        // Skip for calculation-only requests
        return req.path.includes('/calculate');
    },
    handler: (req, res) => {
        console.warn(`Journey submission rate limit exceeded for user: ${req.user?.accountId || req.ip}`);
        res.status(429).json({
            success: false,
            error: 'Too many journey submissions, please wait before submitting another journey.',
            retryAfter: '1 minute'
        });
    }
});

// Authentication rate limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 auth attempts per 15 minutes
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful auth requests
    handler: (req, res) => {
        console.warn(`Authentication rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            error: 'Too many authentication attempts, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

// Security headers middleware
const securityHeaders = (req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Remove server information
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    next();
};

// DDoS protection middleware
const ddosProtection = (req, res, next) => {
    const suspiciousPatterns = [
        // Check for suspicious user agents
        /bot|crawler|spider|scraper/i.test(req.get('User-Agent') || ''),

        // Check for suspicious paths
        /\.php|\.asp|\.jsp|admin|wp-|drupal/i.test(req.path),

        // Check for excessive header size
        JSON.stringify(req.headers).length > 8192,

        // Check for suspicious query parameters
        Object.keys(req.query).some(key => key.length > 100 ||
            /script|javascript|vbscript|onclick|onerror|onload/i.test(req.query[key]))
    ];

    if (suspiciousPatterns.some(pattern => pattern)) {
        console.warn(`Suspicious request detected from IP: ${req.ip}, Path: ${req.path}, UA: ${req.get('User-Agent')}`);

        return res.status(403).json({
            success: false,
            error: 'Request blocked for security reasons'
        });
    }

    next();
};

module.exports = {
    generalLimiter,
    strictLimiter,
    journeyLimiter,
    authLimiter,
    securityHeaders,
    ddosProtection,
    rateLimiter: generalLimiter
};