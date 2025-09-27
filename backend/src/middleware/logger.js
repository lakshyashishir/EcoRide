const winston = require('winston');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'ecoride-backend' },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 10 * 1024 * 1024,             maxFiles: 5,
            tailable: true
        }),

        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 10 * 1024 * 1024,             maxFiles: 10,
            tailable: true
        }),

        new winston.transports.File({
            filename: path.join(logsDir, 'hedera.log'),
            level: 'info',
            maxsize: 10 * 1024 * 1024,             maxFiles: 5,
            tailable: true,
            format: winston.format.combine(
                winston.format.label({ label: 'hedera' }),
                logFormat
            )
        }),

        new winston.transports.File({
            filename: path.join(logsDir, 'security.log'),
            level: 'warn',
            maxsize: 5 * 1024 * 1024,
            maxFiles: 10,
            tailable: true,
            format: winston.format.combine(
                winston.format.label({ label: 'security' }),
                logFormat
            )
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

const morganStream = {
    write: (message) => {
        logger.info(message.trim(), { type: 'http' });
    }
};

const httpLogger = morgan(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms',
    { stream: morganStream }
);

const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    req.requestId = requestId;

    logger.info('Incoming Request', {
        requestId,
        method: req.method,
        url: req.url,
        path: req.path,
        query: req.query,
        headers: sanitizeHeaders(req.headers),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        type: 'request_start'
    });

    if (req.method !== 'GET' && req.body) {
        logger.info('Request Body', {
            requestId,
            body: sanitizeRequestBody(req.body),
            type: 'request_body'
        });
    }

    const originalSend = res.send;
    res.send = function(body) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        logger.info('Response Sent', {
            requestId,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            contentLength: res.get('Content-Length') || body?.length || 0,
            timestamp: new Date().toISOString(),
            type: 'request_end'
        });

        if (res.statusCode >= 400 || process.env.LOG_RESPONSE_BODY === 'true') {
            logger.info('Response Body', {
                requestId,
                statusCode: res.statusCode,
                body: sanitizeResponseBody(body),
                type: 'response_body'
            });
        }

        return originalSend.call(this, body);
    };

    next();
};

const hederaLogger = {
    info: (message, meta = {}) => {
        logger.info(message, { ...meta, service: 'hedera', type: 'hedera_operation' });
    },
    error: (message, error = null, meta = {}) => {
        logger.error(message, {
            ...meta,
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : null,
            service: 'hedera',
            type: 'hedera_error'
        });
    },
    warn: (message, meta = {}) => {
        logger.warn(message, { ...meta, service: 'hedera', type: 'hedera_warning' });
    },
    debug: (message, meta = {}) => {
        logger.debug(message, { ...meta, service: 'hedera', type: 'hedera_debug' });
    }
};

const securityLogger = {
    logSuspiciousActivity: (activity, req, details = {}) => {
        logger.warn('Suspicious Activity Detected', {
            activity,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            headers: sanitizeHeaders(req.headers),
            details,
            timestamp: new Date().toISOString(),
            type: 'security_alert',
            label: 'security'
        });
    },

    logAuthAttempt: (success, accountId, req, details = {}) => {
        const level = success ? 'info' : 'warn';
        logger[level]('Authentication Attempt', {
            success,
            accountId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            details,
            timestamp: new Date().toISOString(),
            type: 'auth_attempt',
            label: 'security'
        });
    },

    logRateLimitExceeded: (limitType, req, details = {}) => {
        logger.warn('Rate Limit Exceeded', {
            limitType,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method,
            details,
            timestamp: new Date().toISOString(),
            type: 'rate_limit_exceeded',
            label: 'security'
        });
    }
};

const errorLogger = (err, req, res, next) => {
    logger.error('Unhandled Error', {
        requestId: req.requestId,
        error: {
            message: err.message,
            stack: err.stack,
            name: err.name
        },
        request: {
            method: req.method,
            url: req.url,
            headers: sanitizeHeaders(req.headers),
            body: sanitizeRequestBody(req.body),
            ip: req.ip,
            userAgent: req.get('User-Agent')
        },
        timestamp: new Date().toISOString(),
        type: 'unhandled_error'
    });

    next(err);
};

const performanceLogger = (req, res, next) => {
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        if (duration > 1000) {
            logger.warn('Slow Request Detected', {
                requestId: req.requestId,
                method: req.method,
                url: req.url,
                duration: `${duration.toFixed(2)}ms`,
                statusCode: res.statusCode,
                type: 'performance_warning'
            });
        }

        logger.debug('Request Performance', {
            requestId: req.requestId,
            duration: `${duration.toFixed(2)}ms`,
            memoryUsage: process.memoryUsage(),
            type: 'performance_metrics'
        });
    });

    next();
};

function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sanitizeHeaders(headers) {
    const sanitized = { ...headers };

    delete sanitized.authorization;
    delete sanitized['x-api-key'];
    delete sanitized.cookie;
    delete sanitized['x-session-token'];

    return sanitized;
}

function sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') {
        return body;
    }

    const sanitized = { ...body };

    delete sanitized.password;
    delete sanitized.privateKey;
    delete sanitized.signature;
    delete sanitized.apiKey;

    Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
            sanitized[key] = sanitized[key].substring(0, 1000) + '... (truncated)';
        }
    });

    return sanitized;
}

function sanitizeResponseBody(body) {
    try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body;

        if (parsed && typeof parsed === 'object') {
            const sanitized = { ...parsed };

            // Remove sensitive fields from response
            if (sanitized.data) {
                delete sanitized.data.privateKey;
                delete sanitized.data.signature;
            }

            return sanitized;
        }

        return parsed;
    } catch (error) {
        return typeof body === 'string' && body.length > 1000
            ? body.substring(0, 1000) + '... (truncated)'
            : body;
    }
}

const logAppStartup = () => {
    logger.info('EcoRide Backend Starting', {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
        timestamp: new Date().toISOString(),
        type: 'app_startup'
    });
};

const logAppShutdown = () => {
    logger.info('EcoRide Backend Shutting Down', {
        timestamp: new Date().toISOString(),
        type: 'app_shutdown'
    });
};

process.on('SIGINT', () => {
    logAppShutdown();
    setTimeout(() => process.exit(0), 1000);
});

process.on('SIGTERM', () => {
    logAppShutdown();
    setTimeout(() => process.exit(0), 1000);
});

module.exports = {
    logger,
    httpLogger,
    requestLogger,
    errorLogger,
    performanceLogger,
    hederaLogger,
    securityLogger,
    logAppStartup,
    logAppShutdown
};