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
exports.SessionModel = void 0;
var uuid_1 = require("uuid");
var connection_1 = require("../database/connection");
var logger_1 = require("../utils/logger");
var SessionModel = /** @class */ (function () {
    function SessionModel() {
    }
    SessionModel.create = function (input, client) {
        return __awaiter(this, void 0, void 0, function () {
            var id, now, query, values, result, _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        id = (0, uuid_1.v4)();
                        now = new Date();
                        query = "\n      INSERT INTO sessions (id, user_id, token, expires_at, created_at, ip_address, user_agent, is_active, last_accessed)\n      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)\n      RETURNING *\n    ";
                        values = [
                            id,
                            input.user_id,
                            input.token,
                            input.expires_at,
                            now,
                            input.ip_address,
                            input.user_agent || null,
                            true,
                            now,
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
                        logger_1.logger.info('Session created successfully', {
                            sessionId: id,
                            userId: input.user_id,
                            expiresAt: input.expires_at
                        });
                        return [2 /*return*/, result.rows[0]];
                    case 6:
                        error_1 = _b.sent();
                        logger_1.logger.error('Error creating session', { userId: input.user_id, error: error_1 });
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    SessionModel.findByToken = function (token, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT * FROM sessions \n      WHERE token = $1 AND is_active = true AND expires_at > NOW()\n    ";
                        values = [token];
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
                        return [2 /*return*/, result.rows[0] || null];
                    case 6:
                        error_2 = _b.sent();
                        logger_1.logger.error('Error finding session by token', { error: error_2 });
                        throw error_2;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    SessionModel.findByUserId = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, activeOnly, client) {
            var query, values, result, _a, error_3;
            if (activeOnly === void 0) { activeOnly = true; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "SELECT * FROM sessions WHERE user_id = $1";
                        values = [userId];
                        if (activeOnly) {
                            query += " AND is_active = true AND expires_at > NOW()";
                        }
                        query += " ORDER BY created_at DESC";
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
                        return [2 /*return*/, result.rows];
                    case 6:
                        error_3 = _b.sent();
                        logger_1.logger.error('Error finding sessions by user ID', { userId: userId, error: error_3 });
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    SessionModel.update = function (id, input, client) {
        return __awaiter(this, void 0, void 0, function () {
            var fields, values, paramIndex, query, result, _a, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        fields = [];
                        values = [];
                        paramIndex = 1;
                        if (input.expires_at !== undefined) {
                            fields.push("expires_at = $".concat(paramIndex++));
                            values.push(input.expires_at);
                        }
                        if (input.is_active !== undefined) {
                            fields.push("is_active = $".concat(paramIndex++));
                            values.push(input.is_active);
                        }
                        if (input.last_accessed !== undefined) {
                            fields.push("last_accessed = $".concat(paramIndex++));
                            values.push(input.last_accessed);
                        }
                        if (!(fields.length === 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.findById(id, client)];
                    case 1: return [2 /*return*/, _b.sent()];
                    case 2:
                        values.push(id);
                        query = "\n      UPDATE sessions \n      SET ".concat(fields.join(', '), " \n      WHERE id = $").concat(paramIndex, "\n      RETURNING *\n    ");
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 8, , 9]);
                        if (!client) return [3 /*break*/, 5];
                        return [4 /*yield*/, client.query(query, values)];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, connection_1.db.query(query, values)];
                    case 6:
                        _a = _b.sent();
                        _b.label = 7;
                    case 7:
                        result = _a;
                        logger_1.logger.info('Session updated successfully', { sessionId: id });
                        return [2 /*return*/, result.rows[0] || null];
                    case 8:
                        error_4 = _b.sent();
                        logger_1.logger.error('Error updating session', { sessionId: id, error: error_4 });
                        throw error_4;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    SessionModel.findById = function (id, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "SELECT * FROM sessions WHERE id = $1";
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
                        return [2 /*return*/, result.rows[0] || null];
                    case 6:
                        error_5 = _b.sent();
                        logger_1.logger.error('Error finding session by ID', { sessionId: id, error: error_5 });
                        throw error_5;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    SessionModel.invalidateByToken = function (token, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, invalidated, error_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      UPDATE sessions \n      SET is_active = false \n      WHERE token = $1 AND is_active = true\n    ";
                        values = [token];
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
                        invalidated = result.rowCount > 0;
                        if (invalidated) {
                            logger_1.logger.info('Session invalidated by token');
                        }
                        return [2 /*return*/, invalidated];
                    case 6:
                        error_6 = _b.sent();
                        logger_1.logger.error('Error invalidating session by token', { error: error_6 });
                        throw error_6;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    SessionModel.invalidateByUserId = function (userId, excludeSessionId, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, invalidatedCount, error_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      UPDATE sessions \n      SET is_active = false \n      WHERE user_id = $1 AND is_active = true\n    ";
                        values = [userId];
                        if (excludeSessionId) {
                            query += " AND id != $2";
                            values.push(excludeSessionId);
                        }
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
                        invalidatedCount = result.rowCount;
                        logger_1.logger.info('Sessions invalidated by user ID', {
                            userId: userId,
                            invalidatedCount: invalidatedCount,
                            excludeSessionId: excludeSessionId
                        });
                        return [2 /*return*/, invalidatedCount];
                    case 6:
                        error_7 = _b.sent();
                        logger_1.logger.error('Error invalidating sessions by user ID', { userId: userId, error: error_7 });
                        throw error_7;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    SessionModel.cleanupExpiredSessions = function (client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result, _a, deletedCount, error_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      DELETE FROM sessions \n      WHERE expires_at < NOW() OR (is_active = false AND created_at < NOW() - INTERVAL '30 days')\n    ";
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
                        logger_1.logger.info('Expired sessions cleaned up', { deletedCount: deletedCount });
                        return [2 /*return*/, deletedCount];
                    case 6:
                        error_8 = _b.sent();
                        logger_1.logger.error('Error cleaning up expired sessions', { error: error_8 });
                        throw error_8;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    SessionModel.updateLastAccessed = function (id, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      UPDATE sessions \n      SET last_accessed = NOW()\n      WHERE id = $1\n    ";
                        values = [id];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (client ? client.query(query, values) : connection_1.db.query(query, values))];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_9 = _a.sent();
                        logger_1.logger.error('Error updating session last accessed', { sessionId: id, error: error_9 });
                        throw error_9;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SessionModel.extendExpiration = function (id, newExpiresAt, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, session, error_10;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      UPDATE sessions \n      SET expires_at = $1, last_accessed = NOW()\n      WHERE id = $2 AND is_active = true\n      RETURNING *\n    ";
                        values = [newExpiresAt, id];
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
                        session = result.rows[0] || null;
                        if (session) {
                            logger_1.logger.info('Session expiration extended', { sessionId: id, newExpiresAt: newExpiresAt });
                        }
                        return [2 /*return*/, session];
                    case 6:
                        error_10 = _b.sent();
                        logger_1.logger.error('Error extending session expiration', { sessionId: id, error: error_10 });
                        throw error_10;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return SessionModel;
}());
exports.SessionModel = SessionModel;
