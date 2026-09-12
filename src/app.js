"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var passport_1 = require("./config/passport");
var redis_1 = require("./utils/redis");
var session_1 = require("./middleware/session");
var rbac_1 = require("./middleware/rbac");
var oauth_1 = require("./routes/oauth");
var config_1 = require("./config");
var logger_1 = require("./utils/logger");
var permissions_1 = require("./utils/permissions");
var app = (0, express_1.default)();
// Basic middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Initialize Redis connection
var redisInitialized = false;
function initializeRedis() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, redis_1.createRedisClient)()];
                case 1:
                    _a.sent();
                    redisInitialized = true;
                    logger_1.logger.info('Redis connection initialized successfully');
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    logger_1.logger.error('Failed to initialize Redis connection', { error: error_1 });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Session middleware (requires Redis)
function setupSessionMiddleware() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (redisInitialized) {
                app.use(session_1.sessionMiddleware);
                app.use(session_1.fingerprintMiddleware);
                app.use(session_1.sessionActivityMiddleware);
                logger_1.logger.info('Session middleware initialized with Redis');
            }
            else {
                logger_1.logger.warn('Session middleware not initialized - Redis connection failed');
            }
            return [2 /*return*/];
        });
    });
}
// Passport middleware
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// OAuth routes
app.use('/auth', oauth_1.default);
// Public routes
app.get('/health', function (req, res) {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        redis: redisInitialized ? 'connected' : 'disconnected',
    });
});
app.get('/login', function (req, res) {
    res.json({
        message: 'Login page',
        oauth: {
            google: '/auth/google',
            github: '/auth/github',
        },
    });
});
// Protected routes examples
// Basic authentication required
app.get('/dashboard', rbac_1.requireAuth, function (req, res) {
    var _a, _b;
    res.json({
        message: 'Welcome to your dashboard',
        userId: (_a = req.session) === null || _a === void 0 ? void 0 : _a.userId,
        sessionId: req.sessionID,
        trustScore: (_b = req.session) === null || _b === void 0 ? void 0 : _b.trustScore,
    });
});
// Role-based access control examples
app.get('/admin', rbac_1.requireAdmin, function (req, res) {
    res.json({
        message: 'Admin panel',
        userRoles: req.userRoles,
        userPermissions: req.userPermissions,
    });
});
app.get('/moderator', (0, rbac_1.requireRole)(['admin', 'moderator']), function (req, res) {
    res.json({
        message: 'Moderator panel',
        userRoles: req.userRoles,
    });
});
// Permission-based access control examples
app.get('/users', (0, rbac_1.requirePermission)(permissions_1.PERMISSIONS.USER_READ), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            // Example: Get users list (would normally fetch from database)
            res.json({
                message: 'Users list',
                userPermissions: req.userPermissions,
                // users: await UserModel.findAll(),
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting users', { error: error });
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
app.post('/users', (0, rbac_1.requirePermission)(permissions_1.PERMISSIONS.USER_WRITE), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            // Example: Create user (would normally create in database)
            res.json({
                message: 'User created',
                // user: await UserModel.create(req.body),
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating user', { error: error });
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
app.delete('/users/:id', (0, rbac_1.requirePermission)(permissions_1.PERMISSIONS.USER_DELETE), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            // Example: Delete user (would normally delete from database)
            res.json({
                message: 'User deleted',
                userId: req.params.id,
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting user', { error: error });
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// Multiple permission requirements
app.get('/audit-logs', (0, rbac_1.requirePermission)([permissions_1.PERMISSIONS.AUDIT_READ, permissions_1.PERMISSIONS.SYSTEM_MONITORING], { requireAll: false }), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            res.json({
                message: 'Audit logs',
                // logs: await AuditLogModel.findAll(),
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting audit logs', { error: error });
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// Profile routes (user can access their own data)
app.get('/profile', rbac_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId;
    var _a;
    return __generator(this, function (_b) {
        try {
            userId = (_a = req.session) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return [2 /*return*/, res.status(401).json({ error: 'Authentication required' })];
            }
            // Example: Get user profile
            res.json({
                message: 'User profile',
                userId: userId,
                // profile: await UserModel.findById(userId),
                // oauthAccounts: await UserModel.getOAuthAccounts(userId),
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting profile', { error: error });
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// Session management routes
app.get('/sessions', rbac_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId;
    var _a;
    return __generator(this, function (_b) {
        try {
            userId = (_a = req.session) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return [2 /*return*/, res.status(401).json({ error: 'Authentication required' })];
            }
            // Example: Get user sessions
            res.json({
                message: 'User sessions',
                currentSessionId: req.sessionID,
                // sessions: await SessionModel.findByUserId(userId),
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting sessions', { error: error });
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
app.delete('/sessions/:sessionId', rbac_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, sessionId;
    var _a;
    return __generator(this, function (_b) {
        try {
            userId = (_a = req.session) === null || _a === void 0 ? void 0 : _a.userId;
            sessionId = req.params.sessionId;
            if (!userId) {
                return [2 /*return*/, res.status(401).json({ error: 'Authentication required' })];
            }
            // Example: Invalidate session
            res.json({
                message: 'Session invalidated',
                sessionId: sessionId,
                // result: await SessionModel.invalidateByToken(sessionId),
            });
        }
        catch (error) {
            logger_1.logger.error('Error invalidating session', { error: error });
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// Logout route
app.post('/logout', rbac_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId_1, sessionId_1;
    var _a;
    return __generator(this, function (_b) {
        try {
            userId_1 = (_a = req.session) === null || _a === void 0 ? void 0 : _a.userId;
            sessionId_1 = req.sessionID;
            // Invalidate session in database
            // await SessionModel.invalidateByToken(sessionId);
            // Destroy Express session
            req.session.destroy(function (err) {
                if (err) {
                    logger_1.logger.error('Error destroying session', { error: err });
                    return res.status(500).json({ error: 'Error logging out' });
                }
                logger_1.logger.info('User logged out successfully', { userId: userId_1, sessionId: sessionId_1 });
                res.json({ message: 'Logged out successfully' });
            });
        }
        catch (error) {
            logger_1.logger.error('Error during logout', { error: error });
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// Error handling middleware
app.use(function (error, req, res, next) {
    logger_1.logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
    });
    res.status(500).json({
        error: 'Internal server error',
        message: config_1.appConfig.server.nodeEnv === 'development' ? error.message : 'Something went wrong',
    });
});
// 404 handler
app.use(function (req, res) {
    res.status(404).json({
        error: 'Not found',
        message: "Route ".concat(req.method, " ").concat(req.path, " not found"),
    });
});
// Initialize the application
function initializeApp() {
    return __awaiter(this, void 0, void 0, function () {
        var port_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, initializeRedis()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, setupSessionMiddleware()];
                case 2:
                    _a.sent();
                    port_1 = config_1.appConfig.server.port;
                    app.listen(port_1, function () {
                        logger_1.logger.info("Server started on port ".concat(port_1), {
                            port: port_1,
                            nodeEnv: config_1.appConfig.server.nodeEnv,
                            redis: redisInitialized ? 'enabled' : 'disabled',
                        });
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    logger_1.logger.error('Failed to initialize application', { error: error_2 });
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Graceful shutdown
process.on('SIGINT', function () { return __awaiter(void 0, void 0, void 0, function () {
    var closeRedisConnection, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger_1.logger.info('Received SIGINT, shutting down gracefully');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                if (!redisInitialized) return [3 /*break*/, 4];
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./utils/redis'); })];
            case 2:
                closeRedisConnection = (_a.sent()).closeRedisConnection;
                return [4 /*yield*/, closeRedisConnection()];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                process.exit(0);
                return [3 /*break*/, 6];
            case 5:
                error_3 = _a.sent();
                logger_1.logger.error('Error during shutdown', { error: error_3 });
                process.exit(1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
process.on('SIGTERM', function () { return __awaiter(void 0, void 0, void 0, function () {
    var closeRedisConnection, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger_1.logger.info('Received SIGTERM, shutting down gracefully');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                if (!redisInitialized) return [3 /*break*/, 4];
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./utils/redis'); })];
            case 2:
                closeRedisConnection = (_a.sent()).closeRedisConnection;
                return [4 /*yield*/, closeRedisConnection()];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                process.exit(0);
                return [3 /*break*/, 6];
            case 5:
                error_4 = _a.sent();
                logger_1.logger.error('Error during shutdown', { error: error_4 });
                process.exit(1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Start the application
if (require.main === module) {
    initializeApp();
}
exports.default = app;
