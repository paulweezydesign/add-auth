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
var passport_1 = require("passport");
var passport_google_oauth20_1 = require("passport-google-oauth20");
var passport_github2_1 = require("passport-github2");
var User_1 = require("../models/User");
var Role_1 = require("../models/Role");
var index_1 = require("./index");
var logger_1 = require("../utils/logger");
// Serialize user for session
passport_1.default.serializeUser(function (user, done) {
    done(null, user.id);
});
// Deserialize user from session
passport_1.default.deserializeUser(function (id, done) { return __awaiter(void 0, void 0, void 0, function () {
    var user, roles, userWithRoles, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, User_1.UserModel.findById(id)];
            case 1:
                user = _a.sent();
                if (!user) return [3 /*break*/, 3];
                return [4 /*yield*/, Role_1.RoleModel.getUserRoles(user.id)];
            case 2:
                roles = _a.sent();
                userWithRoles = __assign(__assign({}, user), { roles: roles });
                done(null, userWithRoles);
                return [3 /*break*/, 4];
            case 3:
                done(null, null);
                _a.label = 4;
            case 4: return [3 /*break*/, 6];
            case 5:
                error_1 = _a.sent();
                logger_1.logger.error('Error deserializing user', { userId: id, error: error_1 });
                done(error_1, null);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Google OAuth Strategy
if (index_1.appConfig.oauth.google.clientId && index_1.appConfig.oauth.google.clientSecret) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: index_1.appConfig.oauth.google.clientId,
        clientSecret: index_1.appConfig.oauth.google.clientSecret,
        callbackURL: "".concat(index_1.appConfig.oauth.callbackUrl, "/google"),
    }, function (accessToken, refreshToken, profile, done) { return __awaiter(void 0, void 0, void 0, function () {
        var user, email, defaultRole, roles, userWithRoles, error_2;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 16, , 17]);
                    logger_1.logger.info('Google OAuth profile received', {
                        id: profile.id,
                        email: (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
                        name: profile.displayName,
                    });
                    return [4 /*yield*/, User_1.UserModel.findByOAuthProvider('google', profile.id)];
                case 1:
                    user = _e.sent();
                    if (!!user) return [3 /*break*/, 12];
                    email = (_d = (_c = profile.emails) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value;
                    if (!email) return [3 /*break*/, 10];
                    return [4 /*yield*/, User_1.UserModel.findByEmail(email)];
                case 2:
                    user = _e.sent();
                    if (!user) return [3 /*break*/, 4];
                    // Link existing account with Google OAuth
                    return [4 /*yield*/, User_1.UserModel.linkOAuthAccount(user.id, 'google', profile.id, {
                            accessToken: accessToken,
                            refreshToken: refreshToken,
                            profile: {
                                id: profile.id,
                                displayName: profile.displayName,
                                emails: profile.emails,
                                photos: profile.photos,
                            },
                        })];
                case 3:
                    // Link existing account with Google OAuth
                    _e.sent();
                    logger_1.logger.info('Linked existing account with Google OAuth', {
                        userId: user.id,
                        email: user.email,
                    });
                    return [3 /*break*/, 9];
                case 4: return [4 /*yield*/, User_1.UserModel.createFromOAuth({
                        provider: 'google',
                        providerId: profile.id,
                        email: email,
                        name: profile.displayName || email.split('@')[0],
                        emailVerified: true, // Google emails are verified
                        oauthData: {
                            accessToken: accessToken,
                            refreshToken: refreshToken,
                            profile: {
                                id: profile.id,
                                displayName: profile.displayName,
                                emails: profile.emails,
                                photos: profile.photos,
                            },
                        },
                    })];
                case 5:
                    // Create new user with Google OAuth
                    user = _e.sent();
                    return [4 /*yield*/, Role_1.RoleModel.findByName('user')];
                case 6:
                    defaultRole = _e.sent();
                    if (!defaultRole) return [3 /*break*/, 8];
                    return [4 /*yield*/, Role_1.RoleModel.assignToUser({
                            user_id: user.id,
                            role_id: defaultRole.id,
                            assigned_by: user.id, // Self-assigned for OAuth
                        })];
                case 7:
                    _e.sent();
                    _e.label = 8;
                case 8:
                    logger_1.logger.info('Created new user from Google OAuth', {
                        userId: user.id,
                        email: user.email,
                    });
                    _e.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10: return [2 /*return*/, done(new Error('No email provided by Google'), null)];
                case 11: return [3 /*break*/, 14];
                case 12: 
                // Update OAuth tokens
                return [4 /*yield*/, User_1.UserModel.updateOAuthTokens(user.id, 'google', {
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                    })];
                case 13:
                    // Update OAuth tokens
                    _e.sent();
                    logger_1.logger.info('Updated Google OAuth tokens for existing user', {
                        userId: user.id,
                    });
                    _e.label = 14;
                case 14: return [4 /*yield*/, Role_1.RoleModel.getUserRoles(user.id)];
                case 15:
                    roles = _e.sent();
                    userWithRoles = __assign(__assign({}, user), { roles: roles });
                    return [2 /*return*/, done(null, userWithRoles)];
                case 16:
                    error_2 = _e.sent();
                    logger_1.logger.error('Error in Google OAuth strategy', { error: error_2 });
                    return [2 /*return*/, done(error_2, null)];
                case 17: return [2 /*return*/];
            }
        });
    }); }));
}
// GitHub OAuth Strategy
if (index_1.appConfig.oauth.github.clientId && index_1.appConfig.oauth.github.clientSecret) {
    passport_1.default.use(new passport_github2_1.Strategy({
        clientID: index_1.appConfig.oauth.github.clientId,
        clientSecret: index_1.appConfig.oauth.github.clientSecret,
        callbackURL: "".concat(index_1.appConfig.oauth.callbackUrl, "/github"),
    }, function (accessToken, refreshToken, profile, done) { return __awaiter(void 0, void 0, void 0, function () {
        var user, email, defaultRole, roles, userWithRoles, error_3;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 16, , 17]);
                    logger_1.logger.info('GitHub OAuth profile received', {
                        id: profile.id,
                        username: profile.username,
                        email: (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
                        name: profile.displayName,
                    });
                    return [4 /*yield*/, User_1.UserModel.findByOAuthProvider('github', profile.id)];
                case 1:
                    user = _e.sent();
                    if (!!user) return [3 /*break*/, 12];
                    email = (_d = (_c = profile.emails) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value;
                    if (!email) return [3 /*break*/, 10];
                    return [4 /*yield*/, User_1.UserModel.findByEmail(email)];
                case 2:
                    user = _e.sent();
                    if (!user) return [3 /*break*/, 4];
                    // Link existing account with GitHub OAuth
                    return [4 /*yield*/, User_1.UserModel.linkOAuthAccount(user.id, 'github', profile.id, {
                            accessToken: accessToken,
                            refreshToken: refreshToken,
                            profile: {
                                id: profile.id,
                                username: profile.username,
                                displayName: profile.displayName,
                                emails: profile.emails,
                                photos: profile.photos,
                            },
                        })];
                case 3:
                    // Link existing account with GitHub OAuth
                    _e.sent();
                    logger_1.logger.info('Linked existing account with GitHub OAuth', {
                        userId: user.id,
                        email: user.email,
                    });
                    return [3 /*break*/, 9];
                case 4: return [4 /*yield*/, User_1.UserModel.createFromOAuth({
                        provider: 'github',
                        providerId: profile.id,
                        email: email,
                        name: profile.displayName || profile.username || email.split('@')[0],
                        emailVerified: true, // GitHub emails are verified
                        oauthData: {
                            accessToken: accessToken,
                            refreshToken: refreshToken,
                            profile: {
                                id: profile.id,
                                username: profile.username,
                                displayName: profile.displayName,
                                emails: profile.emails,
                                photos: profile.photos,
                            },
                        },
                    })];
                case 5:
                    // Create new user with GitHub OAuth
                    user = _e.sent();
                    return [4 /*yield*/, Role_1.RoleModel.findByName('user')];
                case 6:
                    defaultRole = _e.sent();
                    if (!defaultRole) return [3 /*break*/, 8];
                    return [4 /*yield*/, Role_1.RoleModel.assignToUser({
                            user_id: user.id,
                            role_id: defaultRole.id,
                            assigned_by: user.id, // Self-assigned for OAuth
                        })];
                case 7:
                    _e.sent();
                    _e.label = 8;
                case 8:
                    logger_1.logger.info('Created new user from GitHub OAuth', {
                        userId: user.id,
                        email: user.email,
                    });
                    _e.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10: return [2 /*return*/, done(new Error('No email provided by GitHub'), null)];
                case 11: return [3 /*break*/, 14];
                case 12: 
                // Update OAuth tokens
                return [4 /*yield*/, User_1.UserModel.updateOAuthTokens(user.id, 'github', {
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                    })];
                case 13:
                    // Update OAuth tokens
                    _e.sent();
                    logger_1.logger.info('Updated GitHub OAuth tokens for existing user', {
                        userId: user.id,
                    });
                    _e.label = 14;
                case 14: return [4 /*yield*/, Role_1.RoleModel.getUserRoles(user.id)];
                case 15:
                    roles = _e.sent();
                    userWithRoles = __assign(__assign({}, user), { roles: roles });
                    return [2 /*return*/, done(null, userWithRoles)];
                case 16:
                    error_3 = _e.sent();
                    logger_1.logger.error('Error in GitHub OAuth strategy', { error: error_3 });
                    return [2 /*return*/, done(error_3, null)];
                case 17: return [2 /*return*/];
            }
        });
    }); }));
}
exports.default = passport_1.default;
