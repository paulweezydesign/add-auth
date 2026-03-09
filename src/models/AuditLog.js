"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.AuditLogModel = void 0;
var uuid_1 = require("uuid");
var audit_1 = require("../types/audit");
var connection_1 = require("../database/connection");
var logger_1 = require("../utils/logger");
var AuditLogModel = /** @class */ (function () {
    function AuditLogModel() {
    }
    AuditLogModel.create = function (input, client) {
        return __awaiter(this, void 0, void 0, function () {
            var id, now, query, values, result, _a, auditLog, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        id = (0, uuid_1.v4)();
                        now = new Date();
                        query = "\n      INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, timestamp, ip_address, user_agent, details, success, error_message)\n      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)\n      RETURNING *\n    ";
                        values = [
                            id,
                            input.user_id || null,
                            input.action,
                            input.resource_type,
                            input.resource_id || null,
                            now,
                            input.ip_address,
                            input.user_agent || null,
                            JSON.stringify(input.details || {}),
                            input.success,
                            input.error_message || null,
                        ];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        if (!client) return [3 /*break*/, 3];
                        return [4 /*yield*/, client.query(query, values)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, connection_1.db.query(query, values)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        result = _a;
                        auditLog = result.rows[0];
                        auditLog.details = JSON.parse(auditLog.details);
                        // Don't log the audit log creation itself to prevent infinite loops
                        return [2 /*return*/, auditLog];
                    case 6:
                        error_1 = _b.sent();
                        logger_1.logger.error('Error creating audit log', {
                            action: input.action,
                            resourceType: input.resource_type,
                            error: error_1
                        });
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AuditLogModel.findById = function (id, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, auditLog, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "SELECT * FROM audit_logs WHERE id = $1";
                        values = [id];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        if (!client) return [3 /*break*/, 3];
                        return [4 /*yield*/, client.query(query, values)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, connection_1.db.query(query, values)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        result = _a;
                        auditLog = result.rows[0];
                        if (auditLog) {
                            auditLog.details = JSON.parse(auditLog.details);
                        }
                        return [2 /*return*/, auditLog || null];
                    case 6:
                        error_2 = _b.sent();
                        logger_1.logger.error('Error finding audit log by ID', { auditLogId: id, error: error_2 });
                        throw error_2;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AuditLogModel.findByUserId = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, offset, limit, client) {
            var query, values, result, _a, error_3;
            if (offset === void 0) { offset = 0; }
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT * FROM audit_logs \n      WHERE user_id = $1 \n      ORDER BY timestamp DESC \n      LIMIT $2 OFFSET $3\n    ";
                        values = [userId, limit, offset];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        if (!client) return [3 /*break*/, 3];
                        return [4 /*yield*/, client.query(query, values)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, connection_1.db.query(query, values)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        result = _a;
                        return [2 /*return*/, result.rows.map(function (auditLog) { return (__assign(__assign({}, auditLog), { details: JSON.parse(auditLog.details) })); })];
                    case 6:
                        error_3 = _b.sent();
                        logger_1.logger.error('Error finding audit logs by user ID', { userId: userId, error: error_3 });
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AuditLogModel.findByAction = function (action_1) {
        return __awaiter(this, arguments, void 0, function (action, offset, limit, client) {
            var query, values, result, _a, error_4;
            if (offset === void 0) { offset = 0; }
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT * FROM audit_logs \n      WHERE action = $1 \n      ORDER BY timestamp DESC \n      LIMIT $2 OFFSET $3\n    ";
                        values = [action, limit, offset];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        if (!client) return [3 /*break*/, 3];
                        return [4 /*yield*/, client.query(query, values)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, connection_1.db.query(query, values)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        result = _a;
                        return [2 /*return*/, result.rows.map(function (auditLog) { return (__assign(__assign({}, auditLog), { details: JSON.parse(auditLog.details) })); })];
                    case 6:
                        error_4 = _b.sent();
                        logger_1.logger.error('Error finding audit logs by action', { action: action, error: error_4 });
                        throw error_4;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AuditLogModel.findByResourceType = function (resourceType_1) {
        return __awaiter(this, arguments, void 0, function (resourceType, offset, limit, client) {
            var query, values, result, _a, error_5;
            if (offset === void 0) { offset = 0; }
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT * FROM audit_logs \n      WHERE resource_type = $1 \n      ORDER BY timestamp DESC \n      LIMIT $2 OFFSET $3\n    ";
                        values = [resourceType, limit, offset];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        if (!client) return [3 /*break*/, 3];
                        return [4 /*yield*/, client.query(query, values)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, connection_1.db.query(query, values)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        result = _a;
                        return [2 /*return*/, result.rows.map(function (auditLog) { return (__assign(__assign({}, auditLog), { details: JSON.parse(auditLog.details) })); })];
                    case 6:
                        error_5 = _b.sent();
                        logger_1.logger.error('Error finding audit logs by resource type', { resourceType: resourceType, error: error_5 });
                        throw error_5;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AuditLogModel.findByResourceId = function (resourceId_1) {
        return __awaiter(this, arguments, void 0, function (resourceId, offset, limit, client) {
            var query, values, result, _a, error_6;
            if (offset === void 0) { offset = 0; }
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT * FROM audit_logs \n      WHERE resource_id = $1 \n      ORDER BY timestamp DESC \n      LIMIT $2 OFFSET $3\n    ";
                        values = [resourceId, limit, offset];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        if (!client) return [3 /*break*/, 3];
                        return [4 /*yield*/, client.query(query, values)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, connection_1.db.query(query, values)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        result = _a;
                        return [2 /*return*/, result.rows.map(function (auditLog) { return (__assign(__assign({}, auditLog), { details: JSON.parse(auditLog.details) })); })];
                    case 6:
                        error_6 = _b.sent();
                        logger_1.logger.error('Error finding audit logs by resource ID', { resourceId: resourceId, error: error_6 });
                        throw error_6;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AuditLogModel.findByDateRange = function (startDate_1, endDate_1) {
        return __awaiter(this, arguments, void 0, function (startDate, endDate, offset, limit, client) {
            var query, values, result, _a, error_7;
            if (offset === void 0) { offset = 0; }
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT * FROM audit_logs \n      WHERE timestamp >= $1 AND timestamp <= $2 \n      ORDER BY timestamp DESC \n      LIMIT $3 OFFSET $4\n    ";
                        values = [startDate, endDate, limit, offset];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        if (!client) return [3 /*break*/, 3];
                        return [4 /*yield*/, client.query(query, values)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, connection_1.db.query(query, values)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        result = _a;
                        return [2 /*return*/, result.rows.map(function (auditLog) { return (__assign(__assign({}, auditLog), { details: JSON.parse(auditLog.details) })); })];
                    case 6:
                        error_7 = _b.sent();
                        logger_1.logger.error('Error finding audit logs by date range', {
                            startDate: startDate,
                            endDate: endDate,
                            error: error_7
                        });
                        throw error_7;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AuditLogModel.findByIpAddress = function (ipAddress_1) {
        return __awaiter(this, arguments, void 0, function (ipAddress, offset, limit, client) {
            var query, values, result, _a, error_8;
            if (offset === void 0) { offset = 0; }
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT * FROM audit_logs \n      WHERE ip_address = $1 \n      ORDER BY timestamp DESC \n      LIMIT $2 OFFSET $3\n    ";
                        values = [ipAddress, limit, offset];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        if (!client) return [3 /*break*/, 3];
                        return [4 /*yield*/, client.query(query, values)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, connection_1.db.query(query, values)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        result = _a;
                        return [2 /*return*/, result.rows.map(function (auditLog) { return (__assign(__assign({}, auditLog), { details: JSON.parse(auditLog.details) })); })];
                    case 6:
                        error_8 = _b.sent();
                        logger_1.logger.error('Error finding audit logs by IP address', { ipAddress: ipAddress, error: error_8 });
                        throw error_8;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AuditLogModel.findFailedActions = function () {
        return __awaiter(this, arguments, void 0, function (offset, limit, client) {
            var query, values, result, _a, error_9;
            if (offset === void 0) { offset = 0; }
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT * FROM audit_logs \n      WHERE success = false \n      ORDER BY timestamp DESC \n      LIMIT $1 OFFSET $2\n    ";
                        values = [limit, offset];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        if (!client) return [3 /*break*/, 3];
                        return [4 /*yield*/, client.query(query, values)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, connection_1.db.query(query, values)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        result = _a;
                        return [2 /*return*/, result.rows.map(function (auditLog) { return (__assign(__assign({}, auditLog), { details: JSON.parse(auditLog.details) })); })];
                    case 6:
                        error_9 = _b.sent();
                        logger_1.logger.error('Error finding failed audit logs', { error: error_9 });
                        throw error_9;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AuditLogModel.getActionCounts = function (startDate, endDate, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, conditions, result, _a, error_10;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT action, COUNT(*) as count\n      FROM audit_logs\n    ";
                        values = [];
                        conditions = [];
                        if (startDate) {
                            conditions.push("timestamp >= $".concat(values.length + 1));
                            values.push(startDate);
                        }
                        if (endDate) {
                            conditions.push("timestamp <= $".concat(values.length + 1));
                            values.push(endDate);
                        }
                        if (conditions.length > 0) {
                            query += " WHERE ".concat(conditions.join(' AND '));
                        }
                        query += " GROUP BY action ORDER BY count DESC";
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        if (!client) return [3 /*break*/, 3];
                        return [4 /*yield*/, client.query(query, values)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, connection_1.db.query(query, values)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        result = _a;
                        return [2 /*return*/, result.rows.map(function (row) { return ({
                                action: row.action,
                                count: parseInt(row.count, 10),
                            }); })];
                    case 6:
                        error_10 = _b.sent();
                        logger_1.logger.error('Error getting action counts', { error: error_10 });
                        throw error_10;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AuditLogModel.cleanupOldLogs = function () {
        return __awaiter(this, arguments, void 0, function (daysToKeep, client) {
            var query, result, _a, deletedCount, error_11;
            if (daysToKeep === void 0) { daysToKeep = 365; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      DELETE FROM audit_logs \n      WHERE timestamp < NOW() - INTERVAL '".concat(daysToKeep, " days'\n    ");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        if (!client) return [3 /*break*/, 3];
                        return [4 /*yield*/, client.query(query)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, connection_1.db.query(query)];
                    case 4:
                        _a = _b.sent();
                        _b.label = 5;
                    case 5:
                        result = _a;
                        deletedCount = result.rowCount;
                        logger_1.logger.info('Old audit logs cleaned up', { deletedCount: deletedCount, daysToKeep: daysToKeep });
                        return [2 /*return*/, deletedCount];
                    case 6:
                        error_11 = _b.sent();
                        logger_1.logger.error('Error cleaning up old audit logs', { error: error_11 });
                        throw error_11;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    // Helper method to log authentication events
    AuditLogModel.logAuthEvent = function (action_1, userId_1, ipAddress_1, userAgent_1, success_1) {
        return __awaiter(this, arguments, void 0, function (action, userId, ipAddress, userAgent, success, details, errorMessage, client) {
            if (details === void 0) { details = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.create({
                            user_id: userId,
                            action: action,
                            resource_type: audit_1.ResourceTypes.USER,
                            resource_id: userId,
                            ip_address: ipAddress,
                            user_agent: userAgent,
                            success: success,
                            details: details,
                            error_message: errorMessage,
                        }, client)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Helper method to log user management events
    AuditLogModel.logUserEvent = function (action_1, targetUserId_1, performedByUserId_1, ipAddress_1, userAgent_1, success_1) {
        return __awaiter(this, arguments, void 0, function (action, targetUserId, performedByUserId, ipAddress, userAgent, success, details, errorMessage, client) {
            if (details === void 0) { details = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.create({
                            user_id: performedByUserId,
                            action: action,
                            resource_type: audit_1.ResourceTypes.USER,
                            resource_id: targetUserId,
                            ip_address: ipAddress,
                            user_agent: userAgent,
                            success: success,
                            details: details,
                            error_message: errorMessage,
                        }, client)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return AuditLogModel;
}());
exports.AuditLogModel = AuditLogModel;
