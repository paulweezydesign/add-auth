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
exports.PermissionService = exports.PERMISSION_GROUPS = exports.PERMISSIONS = void 0;
var Role_1 = require("../models/Role");
var logger_1 = require("./logger");
/**
 * Standard permission constants
 */
exports.PERMISSIONS = {
    // User permissions
    USER_READ: 'user:read',
    USER_READ_OWN: 'user:read_own',
    USER_WRITE: 'user:write',
    USER_WRITE_OWN: 'user:write_own',
    USER_DELETE: 'user:delete',
    USER_DELETE_OWN: 'user:delete_own',
    // Role permissions
    ROLE_READ: 'role:read',
    ROLE_WRITE: 'role:write',
    ROLE_DELETE: 'role:delete',
    ROLE_ASSIGN: 'role:assign',
    // Session permissions
    SESSION_READ: 'session:read',
    SESSION_READ_OWN: 'session:read_own',
    SESSION_WRITE: 'session:write',
    SESSION_WRITE_OWN: 'session:write_own',
    SESSION_DELETE: 'session:delete',
    SESSION_DELETE_OWN: 'session:delete_own',
    // Audit permissions
    AUDIT_READ: 'audit:read',
    AUDIT_WRITE: 'audit:write',
    // System permissions
    SYSTEM_ADMIN: 'system:admin',
    SYSTEM_MAINTENANCE: 'system:maintenance',
    SYSTEM_MONITORING: 'system:monitoring',
};
/**
 * Permission groups for easier management
 */
exports.PERMISSION_GROUPS = {
    USER_MANAGEMENT: [
        exports.PERMISSIONS.USER_READ,
        exports.PERMISSIONS.USER_WRITE,
        exports.PERMISSIONS.USER_DELETE,
    ],
    ROLE_MANAGEMENT: [
        exports.PERMISSIONS.ROLE_READ,
        exports.PERMISSIONS.ROLE_WRITE,
        exports.PERMISSIONS.ROLE_DELETE,
        exports.PERMISSIONS.ROLE_ASSIGN,
    ],
    SESSION_MANAGEMENT: [
        exports.PERMISSIONS.SESSION_READ,
        exports.PERMISSIONS.SESSION_WRITE,
        exports.PERMISSIONS.SESSION_DELETE,
    ],
    AUDIT_MANAGEMENT: [
        exports.PERMISSIONS.AUDIT_READ,
        exports.PERMISSIONS.AUDIT_WRITE,
    ],
    SYSTEM_MANAGEMENT: [
        exports.PERMISSIONS.SYSTEM_ADMIN,
        exports.PERMISSIONS.SYSTEM_MAINTENANCE,
        exports.PERMISSIONS.SYSTEM_MONITORING,
    ],
};
/**
 * Permission validation and checking utilities
 */
var PermissionService = /** @class */ (function () {
    function PermissionService() {
    }
    /**
     * Check if a user has a specific permission
     */
    PermissionService.hasPermission = function (userId, permission) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Role_1.RoleModel.hasPermission(userId, permission)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.logger.error('Error checking permission', { userId: userId, permission: permission, error: error_1 });
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if a user has any of the specified permissions
     */
    PermissionService.hasAnyPermission = function (userId, permissions) {
        return __awaiter(this, void 0, void 0, function () {
            var userPermissions_1, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Role_1.RoleModel.getUserPermissions(userId)];
                    case 1:
                        userPermissions_1 = _a.sent();
                        return [2 /*return*/, permissions.some(function (permission) { return userPermissions_1.includes(permission); })];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.logger.error('Error checking any permission', { userId: userId, permissions: permissions, error: error_2 });
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if a user has all of the specified permissions
     */
    PermissionService.hasAllPermissions = function (userId, permissions) {
        return __awaiter(this, void 0, void 0, function () {
            var userPermissions_2, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Role_1.RoleModel.getUserPermissions(userId)];
                    case 1:
                        userPermissions_2 = _a.sent();
                        return [2 /*return*/, permissions.every(function (permission) { return userPermissions_2.includes(permission); })];
                    case 2:
                        error_3 = _a.sent();
                        logger_1.logger.error('Error checking all permissions', { userId: userId, permissions: permissions, error: error_3 });
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all permissions for a user
     */
    PermissionService.getUserPermissions = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Role_1.RoleModel.getUserPermissions(userId)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_4 = _a.sent();
                        logger_1.logger.error('Error getting user permissions', { userId: userId, error: error_4 });
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if a user can perform an action on a resource
     */
    PermissionService.canPerformAction = function (userId, action, resource, resourceOwnerId) {
        return __awaiter(this, void 0, void 0, function () {
            var permission, ownPermission, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        permission = "".concat(resource, ":").concat(action);
                        ownPermission = "".concat(resource, ":").concat(action, "_own");
                        return [4 /*yield*/, this.hasPermission(userId, permission)];
                    case 1:
                        // Check if user has general permission
                        if (_a.sent()) {
                            return [2 /*return*/, true];
                        }
                        if (!(resourceOwnerId && userId === resourceOwnerId)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.hasPermission(userId, ownPermission)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3: return [2 /*return*/, false];
                    case 4:
                        error_5 = _a.sent();
                        logger_1.logger.error('Error checking action permission', {
                            userId: userId,
                            action: action,
                            resource: resource,
                            resourceOwnerId: resourceOwnerId,
                            error: error_5
                        });
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if a user can read a resource
     */
    PermissionService.canRead = function (userId, resource, resourceOwnerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canPerformAction(userId, 'read', resource, resourceOwnerId)];
            });
        });
    };
    /**
     * Check if a user can write to a resource
     */
    PermissionService.canWrite = function (userId, resource, resourceOwnerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canPerformAction(userId, 'write', resource, resourceOwnerId)];
            });
        });
    };
    /**
     * Check if a user can delete a resource
     */
    PermissionService.canDelete = function (userId, resource, resourceOwnerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.canPerformAction(userId, 'delete', resource, resourceOwnerId)];
            });
        });
    };
    /**
     * Check if a user has admin privileges
     */
    PermissionService.isAdmin = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userRoles, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Role_1.RoleModel.getUserRoles(userId)];
                    case 1:
                        userRoles = _a.sent();
                        return [2 /*return*/, userRoles.some(function (role) { return role.name === 'admin'; })];
                    case 2:
                        error_6 = _a.sent();
                        logger_1.logger.error('Error checking admin status', { userId: userId, error: error_6 });
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if a user has moderator privileges
     */
    PermissionService.isModerator = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userRoles, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Role_1.RoleModel.getUserRoles(userId)];
                    case 1:
                        userRoles = _a.sent();
                        return [2 /*return*/, userRoles.some(function (role) { return ['admin', 'moderator'].includes(role.name); })];
                    case 2:
                        error_7 = _a.sent();
                        logger_1.logger.error('Error checking moderator status', { userId: userId, error: error_7 });
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if a user has system-level permissions
     */
    PermissionService.hasSystemPermission = function (userId, permission) {
        return __awaiter(this, void 0, void 0, function () {
            var error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!permission.startsWith('system:')) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.isAdmin(userId)];
                    case 1:
                        // Only admins can have system permissions
                        if (!(_a.sent())) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.hasPermission(userId, permission)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_8 = _a.sent();
                        logger_1.logger.error('Error checking system permission', { userId: userId, permission: permission, error: error_8 });
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate permission format
     */
    PermissionService.validatePermission = function (permission) {
        var permissionPattern = /^[a-z_]+:[a-z_]+$/;
        return permissionPattern.test(permission);
    };
    /**
     * Get permission hierarchy (permissions that grant access to other permissions)
     */
    PermissionService.getPermissionHierarchy = function () {
        var _a;
        return _a = {},
            _a[exports.PERMISSIONS.SYSTEM_ADMIN] = Object.values(exports.PERMISSIONS),
            _a[exports.PERMISSIONS.USER_WRITE] = [exports.PERMISSIONS.USER_READ],
            _a[exports.PERMISSIONS.USER_DELETE] = [exports.PERMISSIONS.USER_READ, exports.PERMISSIONS.USER_WRITE],
            _a[exports.PERMISSIONS.ROLE_WRITE] = [exports.PERMISSIONS.ROLE_READ],
            _a[exports.PERMISSIONS.ROLE_DELETE] = [exports.PERMISSIONS.ROLE_READ, exports.PERMISSIONS.ROLE_WRITE],
            _a[exports.PERMISSIONS.SESSION_WRITE] = [exports.PERMISSIONS.SESSION_READ],
            _a[exports.PERMISSIONS.SESSION_DELETE] = [exports.PERMISSIONS.SESSION_READ, exports.PERMISSIONS.SESSION_WRITE],
            _a[exports.PERMISSIONS.AUDIT_WRITE] = [exports.PERMISSIONS.AUDIT_READ],
            _a;
    };
    /**
     * Check if a permission implies other permissions
     */
    PermissionService.getImpliedPermissions = function (permission) {
        var hierarchy = this.getPermissionHierarchy();
        return hierarchy[permission] || [];
    };
    /**
     * Filter permissions based on user's access level
     */
    PermissionService.filterPermissions = function (userId, permissions) {
        return __awaiter(this, void 0, void 0, function () {
            var userPermissions_3, error_9;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getUserPermissions(userId)];
                    case 1:
                        userPermissions_3 = _a.sent();
                        return [2 /*return*/, permissions.filter(function (permission) {
                                // Check direct permission
                                if (userPermissions_3.includes(permission)) {
                                    return true;
                                }
                                // Check implied permissions
                                var impliedPermissions = _this.getImpliedPermissions(permission);
                                return impliedPermissions.some(function (implied) { return userPermissions_3.includes(implied); });
                            })];
                    case 2:
                        error_9 = _a.sent();
                        logger_1.logger.error('Error filtering permissions', { userId: userId, permissions: permissions, error: error_9 });
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if user has elevated permissions for sensitive operations
     */
    PermissionService.hasElevatedPermissions = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var sensitivePermissions, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        sensitivePermissions = [
                            exports.PERMISSIONS.SYSTEM_ADMIN,
                            exports.PERMISSIONS.SYSTEM_MAINTENANCE,
                            exports.PERMISSIONS.USER_DELETE,
                            exports.PERMISSIONS.ROLE_DELETE,
                            exports.PERMISSIONS.AUDIT_WRITE,
                        ];
                        return [4 /*yield*/, this.hasAnyPermission(userId, sensitivePermissions)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_10 = _a.sent();
                        logger_1.logger.error('Error checking elevated permissions', { userId: userId, error: error_10 });
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get resource-specific permissions for a user
     */
    PermissionService.getResourcePermissions = function (userId, resource) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, canRead, canWrite, canDelete, error_11;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.all([
                                this.canRead(userId, resource),
                                this.canWrite(userId, resource),
                                this.canDelete(userId, resource),
                            ])];
                    case 1:
                        _a = _b.sent(), canRead = _a[0], canWrite = _a[1], canDelete = _a[2];
                        return [2 /*return*/, { canRead: canRead, canWrite: canWrite, canDelete: canDelete }];
                    case 2:
                        error_11 = _b.sent();
                        logger_1.logger.error('Error getting resource permissions', { userId: userId, resource: resource, error: error_11 });
                        return [2 /*return*/, { canRead: false, canWrite: false, canDelete: false }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if user can access admin interface
     */
    PermissionService.canAccessAdmin = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var adminPermissions, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        adminPermissions = [
                            exports.PERMISSIONS.SYSTEM_ADMIN,
                            exports.PERMISSIONS.USER_WRITE,
                            exports.PERMISSIONS.ROLE_WRITE,
                            exports.PERMISSIONS.AUDIT_READ,
                        ];
                        return [4 /*yield*/, this.hasAnyPermission(userId, adminPermissions)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_12 = _a.sent();
                        logger_1.logger.error('Error checking admin access', { userId: userId, error: error_12 });
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Audit permission check
     */
    PermissionService.auditPermissionCheck = function (userId, permission, granted, context) {
        return __awaiter(this, void 0, void 0, function () {
            var AuditLogModel, error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('../models/AuditLog'); })];
                    case 1:
                        AuditLogModel = (_a.sent()).AuditLogModel;
                        return [4 /*yield*/, AuditLogModel.create({
                                user_id: userId,
                                action: 'permission_check',
                                resource_type: 'permission',
                                resource_id: permission,
                                details: {
                                    permission: permission,
                                    granted: granted,
                                    context: context,
                                    timestamp: new Date().toISOString(),
                                },
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_13 = _a.sent();
                        logger_1.logger.error('Error auditing permission check', {
                            userId: userId,
                            permission: permission,
                            granted: granted,
                            error: error_13
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return PermissionService;
}());
exports.PermissionService = PermissionService;
exports.default = PermissionService;
