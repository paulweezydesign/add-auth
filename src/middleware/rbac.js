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
exports.requireModerator = exports.requireAdmin = void 0;
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
exports.requireRoleOrPermission = requireRoleOrPermission;
exports.requireOwnership = requireOwnership;
exports.requireTrustScore = requireTrustScore;
exports.hasPermission = hasPermission;
exports.getUserRoles = getUserRoles;
exports.getUserPermissions = getUserPermissions;
var Role_1 = require("../models/Role");
var logger_1 = require("../utils/logger");
/**
 * Role-Based Access Control middleware
 * Checks if user has required roles or permissions
 */
function requireAuth(req, res, next) {
    var _a, _b;
    if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.isAuthenticated) || !((_b = req.session) === null || _b === void 0 ? void 0 : _b.userId)) {
        logger_1.logger.warn('Unauthorized access attempt - no valid session', {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            path: req.path,
        });
        res.status(401).json({
            error: 'Authentication required',
            message: 'Please log in to access this resource',
            code: 'AUTHENTICATION_REQUIRED',
        });
        return;
    }
    next();
}
/**
 * Role-based authorization middleware
 */
function requireRole(roles, options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var userId, requiredRoles, requireAll, userRoles, userRoleNames_1, hasRequiredRole, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.isAuthenticated) || !((_b = req.session) === null || _b === void 0 ? void 0 : _b.userId)) {
                        return [2 /*return*/, handleUnauthorized(req, res, 'Authentication required', options.onUnauthorized)];
                    }
                    userId = req.session.userId;
                    requiredRoles = Array.isArray(roles) ? roles : [roles];
                    requireAll = options.requireAll || false;
                    return [4 /*yield*/, Role_1.RoleModel.getUserRoles(userId)];
                case 1:
                    userRoles = _c.sent();
                    userRoleNames_1 = userRoles.map(function (role) { return role.name; });
                    // Store user roles in request for later use
                    req.userRoles = userRoleNames_1;
                    hasRequiredRole = requireAll
                        ? requiredRoles.every(function (role) { return userRoleNames_1.includes(role); })
                        : requiredRoles.some(function (role) { return userRoleNames_1.includes(role); });
                    if (!hasRequiredRole) {
                        logger_1.logger.warn('Access denied - insufficient roles', {
                            userId: userId,
                            userRoles: userRoleNames_1,
                            requiredRoles: requiredRoles,
                            requireAll: requireAll,
                            path: req.path,
                        });
                        return [2 /*return*/, handleUnauthorized(req, res, 'Insufficient permissions - required roles not found', options.onUnauthorized)];
                    }
                    logger_1.logger.debug('Role authorization successful', {
                        userId: userId,
                        userRoles: userRoleNames_1,
                        requiredRoles: requiredRoles,
                        path: req.path,
                    });
                    next();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _c.sent();
                    logger_1.logger.error('Error in role authorization middleware', { error: error_1 });
                    res.status(500).json({
                        error: 'Internal server error',
                        message: 'Authorization check failed',
                        code: 'AUTHORIZATION_ERROR',
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
}
/**
 * Permission-based authorization middleware
 */
function requirePermission(permissions, options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var userId, requiredPermissions, requireAll, userPermissions_1, hasRequiredPermission, error_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.isAuthenticated) || !((_b = req.session) === null || _b === void 0 ? void 0 : _b.userId)) {
                        return [2 /*return*/, handleUnauthorized(req, res, 'Authentication required', options.onUnauthorized)];
                    }
                    userId = req.session.userId;
                    requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
                    requireAll = options.requireAll || false;
                    return [4 /*yield*/, Role_1.RoleModel.getUserPermissions(userId)];
                case 1:
                    userPermissions_1 = _c.sent();
                    // Store user permissions in request for later use
                    req.userPermissions = userPermissions_1;
                    hasRequiredPermission = requireAll
                        ? requiredPermissions.every(function (permission) { return userPermissions_1.includes(permission); })
                        : requiredPermissions.some(function (permission) { return userPermissions_1.includes(permission); });
                    if (!hasRequiredPermission) {
                        logger_1.logger.warn('Access denied - insufficient permissions', {
                            userId: userId,
                            userPermissions: userPermissions_1,
                            requiredPermissions: requiredPermissions,
                            requireAll: requireAll,
                            path: req.path,
                        });
                        return [2 /*return*/, handleUnauthorized(req, res, 'Insufficient permissions - required permissions not found', options.onUnauthorized)];
                    }
                    logger_1.logger.debug('Permission authorization successful', {
                        userId: userId,
                        userPermissions: userPermissions_1,
                        requiredPermissions: requiredPermissions,
                        path: req.path,
                    });
                    next();
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _c.sent();
                    logger_1.logger.error('Error in permission authorization middleware', { error: error_2 });
                    res.status(500).json({
                        error: 'Internal server error',
                        message: 'Authorization check failed',
                        code: 'AUTHORIZATION_ERROR',
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
}
/**
 * Combined role and permission middleware
 */
function requireRoleOrPermission(roles, permissions, options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var userId, requiredRoles, requiredPermissions, _a, userRoles, userPermissions_2, userRoleNames_2, hasRequiredRole, hasRequiredPermission, error_3;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    if (!((_b = req.session) === null || _b === void 0 ? void 0 : _b.isAuthenticated) || !((_c = req.session) === null || _c === void 0 ? void 0 : _c.userId)) {
                        return [2 /*return*/, handleUnauthorized(req, res, 'Authentication required', options.onUnauthorized)];
                    }
                    userId = req.session.userId;
                    requiredRoles = Array.isArray(roles) ? roles : [roles];
                    requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
                    return [4 /*yield*/, Promise.all([
                            Role_1.RoleModel.getUserRoles(userId),
                            Role_1.RoleModel.getUserPermissions(userId),
                        ])];
                case 1:
                    _a = _d.sent(), userRoles = _a[0], userPermissions_2 = _a[1];
                    userRoleNames_2 = userRoles.map(function (role) { return role.name; });
                    // Store in request for later use
                    req.userRoles = userRoleNames_2;
                    req.userPermissions = userPermissions_2;
                    hasRequiredRole = requiredRoles.some(function (role) { return userRoleNames_2.includes(role); });
                    hasRequiredPermission = requiredPermissions.some(function (permission) { return userPermissions_2.includes(permission); });
                    if (!hasRequiredRole && !hasRequiredPermission) {
                        logger_1.logger.warn('Access denied - insufficient roles and permissions', {
                            userId: userId,
                            userRoles: userRoleNames_2,
                            userPermissions: userPermissions_2,
                            requiredRoles: requiredRoles,
                            requiredPermissions: requiredPermissions,
                            path: req.path,
                        });
                        return [2 /*return*/, handleUnauthorized(req, res, 'Insufficient permissions - required roles or permissions not found', options.onUnauthorized)];
                    }
                    logger_1.logger.debug('Combined authorization successful', {
                        userId: userId,
                        userRoles: userRoleNames_2,
                        userPermissions: userPermissions_2,
                        requiredRoles: requiredRoles,
                        requiredPermissions: requiredPermissions,
                        path: req.path,
                    });
                    next();
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _d.sent();
                    logger_1.logger.error('Error in combined authorization middleware', { error: error_3 });
                    res.status(500).json({
                        error: 'Internal server error',
                        message: 'Authorization check failed',
                        code: 'AUTHORIZATION_ERROR',
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
}
/**
 * Middleware to check if user owns a resource
 */
function requireOwnership(resourceUserIdField) {
    var _this = this;
    if (resourceUserIdField === void 0) { resourceUserIdField = 'user_id'; }
    return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var userId, resourceUserId;
        var _a, _b;
        return __generator(this, function (_c) {
            try {
                if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.isAuthenticated) || !((_b = req.session) === null || _b === void 0 ? void 0 : _b.userId)) {
                    return [2 /*return*/, handleUnauthorized(req, res, 'Authentication required')];
                }
                userId = req.session.userId;
                resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
                if (!resourceUserId) {
                    logger_1.logger.warn('Resource ownership check failed - no resource user ID found', {
                        userId: userId,
                        resourceUserIdField: resourceUserIdField,
                        params: req.params,
                        body: req.body,
                        path: req.path,
                    });
                    return [2 /*return*/, res.status(400).json({
                            error: 'Bad request',
                            message: 'Resource user ID not found',
                            code: 'RESOURCE_USER_ID_MISSING',
                        })];
                }
                if (userId !== resourceUserId) {
                    logger_1.logger.warn('Access denied - resource ownership mismatch', {
                        userId: userId,
                        resourceUserId: resourceUserId,
                        path: req.path,
                    });
                    return [2 /*return*/, handleUnauthorized(req, res, 'You can only access your own resources')];
                }
                logger_1.logger.debug('Resource ownership check successful', {
                    userId: userId,
                    resourceUserId: resourceUserId,
                    path: req.path,
                });
                next();
            }
            catch (error) {
                logger_1.logger.error('Error in ownership middleware', { error: error });
                res.status(500).json({
                    error: 'Internal server error',
                    message: 'Ownership check failed',
                    code: 'OWNERSHIP_CHECK_ERROR',
                });
            }
            return [2 /*return*/];
        });
    }); };
}
/**
 * Middleware to check if user has admin privileges
 */
exports.requireAdmin = requireRole('admin');
/**
 * Middleware to check if user has moderator or admin privileges
 */
exports.requireModerator = requireRole(['admin', 'moderator']);
/**
 * Middleware to check user trust score
 */
function requireTrustScore(minimumScore) {
    if (minimumScore === void 0) { minimumScore = 0.5; }
    return function (req, res, next) {
        var _a, _b;
        if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.isAuthenticated) || !((_b = req.session) === null || _b === void 0 ? void 0 : _b.userId)) {
            return handleUnauthorized(req, res, 'Authentication required');
        }
        var trustScore = req.session.trustScore || 0;
        if (trustScore < minimumScore) {
            logger_1.logger.warn('Access denied - insufficient trust score', {
                userId: req.session.userId,
                trustScore: trustScore,
                minimumScore: minimumScore,
                path: req.path,
            });
            return handleUnauthorized(req, res, 'Additional security verification required');
        }
        next();
    };
}
/**
 * Handle unauthorized access
 */
function handleUnauthorized(req, res, message, customHandler) {
    if (customHandler) {
        customHandler(req, res);
        return;
    }
    res.status(403).json({
        error: 'Forbidden',
        message: message,
        code: 'INSUFFICIENT_PERMISSIONS',
    });
}
/**
 * Utility function to check if user has specific permission
 */
function hasPermission(userId, permission) {
    return __awaiter(this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Role_1.RoleModel.hasPermission(userId, permission)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_4 = _a.sent();
                    logger_1.logger.error('Error checking permission', { userId: userId, permission: permission, error: error_4 });
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Utility function to get user roles
 */
function getUserRoles(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var roles, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Role_1.RoleModel.getUserRoles(userId)];
                case 1:
                    roles = _a.sent();
                    return [2 /*return*/, roles.map(function (role) { return role.name; })];
                case 2:
                    error_5 = _a.sent();
                    logger_1.logger.error('Error getting user roles', { userId: userId, error: error_5 });
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Utility function to get user permissions
 */
function getUserPermissions(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Role_1.RoleModel.getUserPermissions(userId)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_6 = _a.sent();
                    logger_1.logger.error('Error getting user permissions', { userId: userId, error: error_6 });
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.default = {
    requireAuth: requireAuth,
    requireRole: requireRole,
    requirePermission: requirePermission,
    requireRoleOrPermission: requireRoleOrPermission,
    requireOwnership: requireOwnership,
    requireAdmin: exports.requireAdmin,
    requireModerator: exports.requireModerator,
    requireTrustScore: requireTrustScore,
    hasPermission: hasPermission,
    getUserRoles: getUserRoles,
    getUserPermissions: getUserPermissions,
};
