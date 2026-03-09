"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.cleanupExpiredSessions = exports.sessionActivityMiddleware = exports.fingerprintMiddleware = exports.sessionMiddleware = exports.sessionConfig = void 0;
var express_session_1 = require("express-session");
var redis_1 = require("../utils/redis");
var config_1 = require("../config");
var logger_1 = require("../utils/logger");
var fingerprint_1 = require("../utils/fingerprint");
var Session_1 = require("../models/Session");
// Custom Redis session store
var RedisSessionStore = /** @class */ (function (_super) {
    __extends(RedisSessionStore, _super);
    function RedisSessionStore(options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this) || this;
        _this.redisClient = (0, redis_1.getRedisClient)();
        _this.ttl = options.ttl || config_1.appConfig.security.sessionTimeout / 1000; // Convert to seconds
        return _this;
    }
    RedisSessionStore.prototype.get = function (sid, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var key, data, session_1, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        key = "session:".concat(sid);
                        return [4 /*yield*/, this.redisClient.get(key)];
                    case 1:
                        data = _a.sent();
                        if (!data) {
                            return [2 /*return*/, callback(null, null)];
                        }
                        session_1 = JSON.parse(data);
                        callback(null, session_1);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.logger.error('Error getting session from Redis', { sessionId: sid, error: error_1 });
                        callback(error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RedisSessionStore.prototype.set = function (sid, session, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var key, data, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        key = "session:".concat(sid);
                        data = JSON.stringify(session);
                        return [4 /*yield*/, this.redisClient.setEx(key, this.ttl, data)];
                    case 1:
                        _a.sent();
                        if (callback)
                            callback();
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.logger.error('Error setting session in Redis', { sessionId: sid, error: error_2 });
                        if (callback)
                            callback(error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RedisSessionStore.prototype.destroy = function (sid, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var key, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        key = "session:".concat(sid);
                        return [4 /*yield*/, this.redisClient.del(key)];
                    case 1:
                        _a.sent();
                        if (callback)
                            callback();
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        logger_1.logger.error('Error destroying session in Redis', { sessionId: sid, error: error_3 });
                        if (callback)
                            callback(error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RedisSessionStore.prototype.touch = function (sid, session, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var key, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        key = "session:".concat(sid);
                        return [4 /*yield*/, this.redisClient.expire(key, this.ttl)];
                    case 1:
                        _a.sent();
                        if (callback)
                            callback();
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        logger_1.logger.error('Error touching session in Redis', { sessionId: sid, error: error_4 });
                        if (callback)
                            callback(error_4);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RedisSessionStore.prototype.clear = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            var keys, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.redisClient.keys('session:*')];
                    case 1:
                        keys = _a.sent();
                        if (!(keys.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.redisClient.del(keys)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        if (callback)
                            callback();
                        return [3 /*break*/, 5];
                    case 4:
                        error_5 = _a.sent();
                        logger_1.logger.error('Error clearing sessions from Redis', { error: error_5 });
                        if (callback)
                            callback(error_5);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    RedisSessionStore.prototype.length = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            var keys, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.redisClient.keys('session:*')];
                    case 1:
                        keys = _a.sent();
                        callback(null, keys.length);
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        logger_1.logger.error('Error getting session count from Redis', { error: error_6 });
                        callback(error_6);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return RedisSessionStore;
}(express_session_1.default.Store));
// Session configuration
exports.sessionConfig = {
    store: new RedisSessionStore(),
    secret: config_1.appConfig.security.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        secure: config_1.appConfig.server.nodeEnv === 'production',
        httpOnly: true,
        maxAge: config_1.appConfig.security.sessionTimeout,
        sameSite: 'strict',
    },
    name: 'sessionId',
};
// Session middleware
exports.sessionMiddleware = (0, express_session_1.default)(exports.sessionConfig);
// Fingerprint validation middleware
var fingerprintMiddleware = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var currentFingerprint, validation;
    return __generator(this, function (_a) {
        try {
            currentFingerprint = fingerprint_1.FingerprintService.generateFingerprint(req);
            // Store current fingerprint in session
            if (req.session) {
                if (req.session.fingerprint) {
                    validation = fingerprint_1.FingerprintService.validateFingerprint(currentFingerprint, req.session.fingerprint);
                    if (!validation.isValid) {
                        logger_1.logger.warn('Session fingerprint validation failed', {
                            sessionId: req.sessionID,
                            userId: req.session.userId,
                            risk: validation.risk,
                            changes: validation.changes,
                        });
                        // Handle based on risk level
                        if (validation.risk === 'high') {
                            // Destroy session and require re-authentication
                            req.session.destroy(function (err) {
                                if (err) {
                                    logger_1.logger.error('Error destroying session after fingerprint validation failure', { error: err });
                                }
                            });
                            return [2 /*return*/, res.status(401).json({
                                    error: 'Session security validation failed',
                                    message: 'Please log in again',
                                    code: 'FINGERPRINT_VALIDATION_FAILED',
                                })];
                        }
                        else if (validation.risk === 'medium') {
                            // Update fingerprint but log the change
                            req.session.fingerprint = currentFingerprint;
                            req.session.trustScore = (req.session.trustScore || 1.0) * 0.8;
                            logger_1.logger.info('Session fingerprint updated due to medium risk changes', {
                                sessionId: req.sessionID,
                                userId: req.session.userId,
                                changes: validation.changes,
                            });
                        }
                    }
                }
                else {
                    // First time - store fingerprint
                    req.session.fingerprint = currentFingerprint;
                    req.session.trustScore = 0.5; // Neutral score for new sessions
                }
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Error in fingerprint middleware', { error: error });
            next(error);
        }
        return [2 /*return*/];
    });
}); };
exports.fingerprintMiddleware = fingerprintMiddleware;
// Session activity tracking middleware
var sessionActivityMiddleware = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var now, lastActivity, timeSinceLastActivity, error_7, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                if (!(req.session && req.session.isAuthenticated && req.session.userId)) return [3 /*break*/, 4];
                now = new Date();
                lastActivity = req.session.lastActivity ? new Date(req.session.lastActivity) : null;
                // Check for session timeout
                if (lastActivity) {
                    timeSinceLastActivity = now.getTime() - lastActivity.getTime();
                    if (timeSinceLastActivity > config_1.appConfig.security.sessionTimeout) {
                        logger_1.logger.info('Session expired due to inactivity', {
                            sessionId: req.sessionID,
                            userId: req.session.userId,
                            lastActivity: lastActivity.toISOString(),
                        });
                        req.session.destroy(function (err) {
                            if (err) {
                                logger_1.logger.error('Error destroying expired session', { error: err });
                            }
                        });
                        return [2 /*return*/, res.status(401).json({
                                error: 'Session expired',
                                message: 'Please log in again',
                                code: 'SESSION_EXPIRED',
                            })];
                    }
                }
                // Update last activity
                req.session.lastActivity = now;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, Session_1.SessionModel.updateLastAccessed(req.sessionID)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                logger_1.logger.error('Error updating session last accessed in database', {
                    sessionId: req.sessionID,
                    error: error_7
                });
                return [3 /*break*/, 4];
            case 4:
                next();
                return [3 /*break*/, 6];
            case 5:
                error_8 = _a.sent();
                logger_1.logger.error('Error in session activity middleware', { error: error_8 });
                next(error_8);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.sessionActivityMiddleware = sessionActivityMiddleware;
// Session cleanup utility
var cleanupExpiredSessions = function () { return __awaiter(void 0, void 0, void 0, function () {
    var deletedCount, redisClient, keys, expiredRedisSessionsCount, _i, keys_1, key, ttl, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 9]);
                return [4 /*yield*/, Session_1.SessionModel.cleanupExpiredSessions()];
            case 1:
                deletedCount = _a.sent();
                logger_1.logger.info('Cleaned up expired sessions from database', { deletedCount: deletedCount });
                redisClient = (0, redis_1.getRedisClient)();
                return [4 /*yield*/, redisClient.keys('session:*')];
            case 2:
                keys = _a.sent();
                expiredRedisSessionsCount = 0;
                _i = 0, keys_1 = keys;
                _a.label = 3;
            case 3:
                if (!(_i < keys_1.length)) return [3 /*break*/, 7];
                key = keys_1[_i];
                return [4 /*yield*/, redisClient.ttl(key)];
            case 4:
                ttl = _a.sent();
                if (!(ttl === -1)) return [3 /*break*/, 6];
                // Session without TTL, remove it
                return [4 /*yield*/, redisClient.del(key)];
            case 5:
                // Session without TTL, remove it
                _a.sent();
                expiredRedisSessionsCount++;
                _a.label = 6;
            case 6:
                _i++;
                return [3 /*break*/, 3];
            case 7:
                if (expiredRedisSessionsCount > 0) {
                    logger_1.logger.info('Cleaned up orphaned Redis sessions', { count: expiredRedisSessionsCount });
                }
                return [3 /*break*/, 9];
            case 8:
                error_9 = _a.sent();
                logger_1.logger.error('Error during session cleanup', { error: error_9 });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.cleanupExpiredSessions = cleanupExpiredSessions;
// Schedule session cleanup (run every hour)
setInterval(exports.cleanupExpiredSessions, 60 * 60 * 1000);
exports.default = exports.sessionMiddleware;
