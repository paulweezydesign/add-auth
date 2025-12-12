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
exports.UserModel = void 0;
var uuid_1 = require("uuid");
var user_1 = require("../types/user");
var connection_1 = require("../database/connection");
var logger_1 = require("../utils/logger");
var UserModel = /** @class */ (function () {
    function UserModel() {
    }
    UserModel.create = function (input, client) {
        return __awaiter(this, void 0, void 0, function () {
            var id, now, query, values, result, _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        id = (0, uuid_1.v4)();
                        now = new Date();
                        query = "\n      INSERT INTO users (id, email, password_hash, created_at, updated_at, status, email_verified, failed_login_attempts)\n      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)\n      RETURNING id, email, created_at, updated_at, status, email_verified, last_login, failed_login_attempts, locked_until\n    ";
                        values = [
                            id,
                            input.email.toLowerCase(),
                            input.password, // This should be hashed before calling this method
                            now,
                            now,
                            user_1.UserStatus.ACTIVE,
                            false,
                            0,
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
                        logger_1.logger.info('User created successfully', { userId: id, email: input.email });
                        return [2 /*return*/, result.rows[0]];
                    case 6:
                        error_1 = _b.sent();
                        logger_1.logger.error('Error creating user', { email: input.email, error: error_1 });
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    UserModel.findById = function (id_1) {
        return __awaiter(this, arguments, void 0, function (id, includePassword, client) {
            var fields, query, values, result, _a, error_2;
            if (includePassword === void 0) { includePassword = false; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        fields = includePassword
                            ? 'id, email, password_hash, created_at, updated_at, status, email_verified, last_login, failed_login_attempts, locked_until'
                            : 'id, email, created_at, updated_at, status, email_verified, last_login, failed_login_attempts, locked_until';
                        query = "SELECT ".concat(fields, " FROM users WHERE id = $1 AND status != $2");
                        values = [id, user_1.UserStatus.DELETED];
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
                        logger_1.logger.error('Error finding user by ID', { userId: id, error: error_2 });
                        throw error_2;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    UserModel.findByEmail = function (email_1) {
        return __awaiter(this, arguments, void 0, function (email, includePassword, client) {
            var fields, query, values, result, _a, error_3;
            if (includePassword === void 0) { includePassword = false; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        fields = includePassword
                            ? 'id, email, password_hash, created_at, updated_at, status, email_verified, last_login, failed_login_attempts, locked_until'
                            : 'id, email, created_at, updated_at, status, email_verified, last_login, failed_login_attempts, locked_until';
                        query = "SELECT ".concat(fields, " FROM users WHERE email = $1 AND status != $2");
                        values = [email.toLowerCase(), user_1.UserStatus.DELETED];
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
                        error_3 = _b.sent();
                        logger_1.logger.error('Error finding user by email', { email: email, error: error_3 });
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    UserModel.update = function (id, input, client) {
        return __awaiter(this, void 0, void 0, function () {
            var fields, values, paramIndex, user, query, result, _a, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        fields = [];
                        values = [];
                        paramIndex = 1;
                        if (input.email !== undefined) {
                            fields.push("email = $".concat(paramIndex++));
                            values.push(input.email.toLowerCase());
                        }
                        if (input.status !== undefined) {
                            fields.push("status = $".concat(paramIndex++));
                            values.push(input.status);
                        }
                        if (input.email_verified !== undefined) {
                            fields.push("email_verified = $".concat(paramIndex++));
                            values.push(input.email_verified);
                        }
                        if (!(fields.length === 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.findById(id, false, client)];
                    case 1:
                        user = _b.sent();
                        return [2 /*return*/, user];
                    case 2:
                        fields.push("updated_at = $".concat(paramIndex++));
                        values.push(new Date());
                        values.push(id);
                        query = "\n      UPDATE users \n      SET ".concat(fields.join(', '), " \n      WHERE id = $").concat(paramIndex, " AND status != $").concat(paramIndex + 1, "\n      RETURNING id, email, created_at, updated_at, status, email_verified, last_login, failed_login_attempts, locked_until\n    ");
                        values.push(user_1.UserStatus.DELETED);
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
                        logger_1.logger.info('User updated successfully', { userId: id });
                        return [2 /*return*/, result.rows[0] || null];
                    case 8:
                        error_4 = _b.sent();
                        logger_1.logger.error('Error updating user', { userId: id, error: error_4 });
                        throw error_4;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    UserModel.updateLastLogin = function (id, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      UPDATE users \n      SET last_login = $1, failed_login_attempts = 0, locked_until = NULL\n      WHERE id = $2\n    ";
                        values = [new Date(), id];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (client ? client.query(query, values) : connection_1.db.query(query, values))];
                    case 2:
                        _a.sent();
                        logger_1.logger.info('User last login updated', { userId: id });
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        logger_1.logger.error('Error updating user last login', { userId: id, error: error_5 });
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UserModel.incrementFailedLoginAttempts = function (id, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      UPDATE users \n      SET failed_login_attempts = failed_login_attempts + 1,\n          locked_until = CASE \n            WHEN failed_login_attempts + 1 >= 5 THEN NOW() + INTERVAL '30 minutes'\n            ELSE locked_until\n          END\n      WHERE id = $1\n    ";
                        values = [id];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (client ? client.query(query, values) : connection_1.db.query(query, values))];
                    case 2:
                        _a.sent();
                        logger_1.logger.info('User failed login attempts incremented', { userId: id });
                        return [3 /*break*/, 4];
                    case 3:
                        error_6 = _a.sent();
                        logger_1.logger.error('Error incrementing failed login attempts', { userId: id, error: error_6 });
                        throw error_6;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UserModel.updatePassword = function (id, passwordHash, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      UPDATE users \n      SET password_hash = $1, updated_at = $2\n      WHERE id = $3\n    ";
                        values = [passwordHash, new Date(), id];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (client ? client.query(query, values) : connection_1.db.query(query, values))];
                    case 2:
                        _a.sent();
                        logger_1.logger.info('User password updated', { userId: id });
                        return [3 /*break*/, 4];
                    case 3:
                        error_7 = _a.sent();
                        logger_1.logger.error('Error updating user password', { userId: id, error: error_7 });
                        throw error_7;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UserModel.delete = function (id, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, deleted, error_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      UPDATE users \n      SET status = $1, updated_at = $2\n      WHERE id = $3 AND status != $1\n    ";
                        values = [user_1.UserStatus.DELETED, new Date(), id];
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
                        deleted = result.rowCount > 0;
                        if (deleted) {
                            logger_1.logger.info('User deleted successfully', { userId: id });
                        }
                        return [2 /*return*/, deleted];
                    case 6:
                        error_8 = _b.sent();
                        logger_1.logger.error('Error deleting user', { userId: id, error: error_8 });
                        throw error_8;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    UserModel.findAll = function () {
        return __awaiter(this, arguments, void 0, function (offset, limit, client) {
            var query, values, result, _a, error_9;
            if (offset === void 0) { offset = 0; }
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT id, email, created_at, updated_at, status, email_verified, last_login, failed_login_attempts, locked_until\n      FROM users \n      WHERE status != $1\n      ORDER BY created_at DESC\n      LIMIT $2 OFFSET $3\n    ";
                        values = [user_1.UserStatus.DELETED, limit, offset];
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
                        error_9 = _b.sent();
                        logger_1.logger.error('Error finding all users', { error: error_9 });
                        throw error_9;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    // OAuth-related methods
    UserModel.createFromOAuth = function (input, client) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, now, userQuery, _a, firstName, lastName, oauthProviders, userValues, oauthQuery, oauthValues, dbClient, shouldCommit, userResult, user, error_10;
            var _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        userId = (0, uuid_1.v4)();
                        now = new Date();
                        userQuery = "\n      INSERT INTO users (id, email, created_at, updated_at, status, email_verified, first_name, last_name, oauth_providers, failed_login_attempts)\n      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)\n      RETURNING id, email, created_at, updated_at, status, email_verified, last_login, failed_login_attempts, locked_until, first_name, last_name, oauth_providers\n    ";
                        _a = this.parseFullName(input.name), firstName = _a[0], lastName = _a[1];
                        oauthProviders = [input.provider];
                        userValues = [
                            userId,
                            input.email.toLowerCase(),
                            now,
                            now,
                            user_1.UserStatus.ACTIVE,
                            input.emailVerified || false,
                            firstName,
                            lastName,
                            JSON.stringify(oauthProviders),
                            0,
                        ];
                        oauthQuery = "\n      INSERT INTO oauth_accounts (user_id, provider, provider_id, access_token, refresh_token, profile_data, created_at, updated_at)\n      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)\n      RETURNING *\n    ";
                        oauthValues = [
                            userId,
                            input.provider,
                            input.providerId,
                            ((_b = input.oauthData) === null || _b === void 0 ? void 0 : _b.accessToken) || null,
                            ((_c = input.oauthData) === null || _c === void 0 ? void 0 : _c.refreshToken) || null,
                            JSON.stringify(((_d = input.oauthData) === null || _d === void 0 ? void 0 : _d.profile) || {}),
                            now,
                            now,
                        ];
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 8, , 11]);
                        dbClient = client || connection_1.db;
                        shouldCommit = !client;
                        if (!shouldCommit) return [3 /*break*/, 3];
                        return [4 /*yield*/, dbClient.query('BEGIN')];
                    case 2:
                        _e.sent();
                        _e.label = 3;
                    case 3: return [4 /*yield*/, dbClient.query(userQuery, userValues)];
                    case 4:
                        userResult = _e.sent();
                        return [4 /*yield*/, dbClient.query(oauthQuery, oauthValues)];
                    case 5:
                        _e.sent();
                        if (!shouldCommit) return [3 /*break*/, 7];
                        return [4 /*yield*/, dbClient.query('COMMIT')];
                    case 6:
                        _e.sent();
                        _e.label = 7;
                    case 7:
                        user = userResult.rows[0];
                        user.oauth_providers = JSON.parse(user.oauth_providers || '[]');
                        logger_1.logger.info('User created from OAuth successfully', {
                            userId: userId,
                            email: input.email,
                            provider: input.provider
                        });
                        return [2 /*return*/, user];
                    case 8:
                        error_10 = _e.sent();
                        if (!!client) return [3 /*break*/, 10];
                        return [4 /*yield*/, connection_1.db.query('ROLLBACK')];
                    case 9:
                        _e.sent();
                        _e.label = 10;
                    case 10:
                        logger_1.logger.error('Error creating user from OAuth', {
                            email: input.email,
                            provider: input.provider,
                            error: error_10
                        });
                        throw error_10;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    UserModel.findByOAuthProvider = function (provider, providerId, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, user, error_11;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT u.id, u.email, u.created_at, u.updated_at, u.status, u.email_verified, \n             u.last_login, u.failed_login_attempts, u.locked_until, u.first_name, \n             u.last_name, u.oauth_providers\n      FROM users u\n      JOIN oauth_accounts oa ON u.id = oa.user_id\n      WHERE oa.provider = $1 AND oa.provider_id = $2 AND u.status != $3\n    ";
                        values = [provider, providerId, user_1.UserStatus.DELETED];
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
                        user = result.rows[0];
                        if (user) {
                            user.oauth_providers = JSON.parse(user.oauth_providers || '[]');
                        }
                        return [2 /*return*/, user || null];
                    case 6:
                        error_11 = _b.sent();
                        logger_1.logger.error('Error finding user by OAuth provider', {
                            provider: provider,
                            providerId: providerId,
                            error: error_11
                        });
                        throw error_11;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    UserModel.linkOAuthAccount = function (userId, provider, providerId, oauthData, client) {
        return __awaiter(this, void 0, void 0, function () {
            var now, oauthQuery, oauthValues, updateUserQuery, updateUserValues, dbClient, shouldCommit, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        oauthQuery = "\n      INSERT INTO oauth_accounts (user_id, provider, provider_id, access_token, refresh_token, profile_data, created_at, updated_at)\n      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)\n      ON CONFLICT (provider, provider_id) \n      DO UPDATE SET \n        access_token = $4,\n        refresh_token = $5,\n        profile_data = $6,\n        updated_at = $8\n    ";
                        oauthValues = [
                            userId,
                            provider,
                            providerId,
                            oauthData.accessToken || null,
                            oauthData.refreshToken || null,
                            JSON.stringify(oauthData.profile || {}),
                            now,
                            now,
                        ];
                        updateUserQuery = "\n      UPDATE users \n      SET oauth_providers = (\n        SELECT COALESCE(\n          jsonb_agg(DISTINCT elem), \n          '[]'::jsonb\n        )\n        FROM (\n          SELECT jsonb_array_elements(COALESCE(oauth_providers::jsonb, '[]'::jsonb)) as elem\n          UNION \n          SELECT $2::jsonb as elem\n        ) sub\n      )\n      WHERE id = $1\n    ";
                        updateUserValues = [userId, JSON.stringify(provider)];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 11]);
                        dbClient = client || connection_1.db;
                        shouldCommit = !client;
                        if (!shouldCommit) return [3 /*break*/, 3];
                        return [4 /*yield*/, dbClient.query('BEGIN')];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, dbClient.query(oauthQuery, oauthValues)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, dbClient.query(updateUserQuery, updateUserValues)];
                    case 5:
                        _a.sent();
                        if (!shouldCommit) return [3 /*break*/, 7];
                        return [4 /*yield*/, dbClient.query('COMMIT')];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        logger_1.logger.info('OAuth account linked successfully', {
                            userId: userId,
                            provider: provider,
                            providerId: providerId
                        });
                        return [3 /*break*/, 11];
                    case 8:
                        error_12 = _a.sent();
                        if (!!client) return [3 /*break*/, 10];
                        return [4 /*yield*/, connection_1.db.query('ROLLBACK')];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10:
                        logger_1.logger.error('Error linking OAuth account', {
                            userId: userId,
                            provider: provider,
                            providerId: providerId,
                            error: error_12
                        });
                        throw error_12;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    UserModel.updateOAuthTokens = function (userId, provider, tokens, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = "\n      UPDATE oauth_accounts \n      SET access_token = $1, refresh_token = $2, updated_at = $3\n      WHERE user_id = $4 AND provider = $5\n    ";
                        values = [
                            tokens.accessToken || null,
                            tokens.refreshToken || null,
                            new Date(),
                            userId,
                            provider,
                        ];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (client ? client.query(query, values) : connection_1.db.query(query, values))];
                    case 2:
                        _a.sent();
                        logger_1.logger.info('OAuth tokens updated', { userId: userId, provider: provider });
                        return [3 /*break*/, 4];
                    case 3:
                        error_13 = _a.sent();
                        logger_1.logger.error('Error updating OAuth tokens', {
                            userId: userId,
                            provider: provider,
                            error: error_13
                        });
                        throw error_13;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    UserModel.getOAuthAccounts = function (userId, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, error_14;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT * FROM oauth_accounts \n      WHERE user_id = $1 \n      ORDER BY created_at DESC\n    ";
                        values = [userId];
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
                        return [2 /*return*/, result.rows.map(function (row) { return (__assign(__assign({}, row), { profile_data: JSON.parse(row.profile_data || '{}') })); })];
                    case 6:
                        error_14 = _b.sent();
                        logger_1.logger.error('Error getting OAuth accounts', { userId: userId, error: error_14 });
                        throw error_14;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    UserModel.unlinkOAuthAccount = function (userId, provider, client) {
        return __awaiter(this, void 0, void 0, function () {
            var deleteQuery, updateUserQuery, values, dbClient, shouldCommit, result, unlinked, error_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        deleteQuery = "\n      DELETE FROM oauth_accounts \n      WHERE user_id = $1 AND provider = $2\n    ";
                        updateUserQuery = "\n      UPDATE users \n      SET oauth_providers = (\n        SELECT COALESCE(\n          jsonb_agg(elem), \n          '[]'::jsonb\n        )\n        FROM (\n          SELECT jsonb_array_elements(COALESCE(oauth_providers::jsonb, '[]'::jsonb)) as elem\n          WHERE elem::text != $2::text\n        ) sub\n      )\n      WHERE id = $1\n    ";
                        values = [userId, provider];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 11]);
                        dbClient = client || connection_1.db;
                        shouldCommit = !client;
                        if (!shouldCommit) return [3 /*break*/, 3];
                        return [4 /*yield*/, dbClient.query('BEGIN')];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [4 /*yield*/, dbClient.query(deleteQuery, values)];
                    case 4:
                        result = _a.sent();
                        return [4 /*yield*/, dbClient.query(updateUserQuery, values)];
                    case 5:
                        _a.sent();
                        if (!shouldCommit) return [3 /*break*/, 7];
                        return [4 /*yield*/, dbClient.query('COMMIT')];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        unlinked = result.rowCount > 0;
                        if (unlinked) {
                            logger_1.logger.info('OAuth account unlinked successfully', { userId: userId, provider: provider });
                        }
                        return [2 /*return*/, unlinked];
                    case 8:
                        error_15 = _a.sent();
                        if (!!client) return [3 /*break*/, 10];
                        return [4 /*yield*/, connection_1.db.query('ROLLBACK')];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10:
                        logger_1.logger.error('Error unlinking OAuth account', {
                            userId: userId,
                            provider: provider,
                            error: error_15
                        });
                        throw error_15;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    UserModel.parseFullName = function (name) {
        if (!name)
            return [null, null];
        var parts = name.trim().split(' ');
        if (parts.length === 1) {
            return [parts[0], null];
        }
        var firstName = parts[0];
        var lastName = parts.slice(1).join(' ');
        return [firstName, lastName];
    };
    return UserModel;
}());
exports.UserModel = UserModel;
