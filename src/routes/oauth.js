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
var passport_1 = require("../config/passport");
var Session_1 = require("../models/Session");
var AuditLog_1 = require("../models/AuditLog");
var fingerprint_1 = require("../utils/fingerprint");
var logger_1 = require("../utils/logger");
var config_1 = require("../config");
var router = (0, express_1.Router)();
// Google OAuth routes
router.get('/google', passport_1.default.authenticate('google', {
    scope: ['profile', 'email']
}));
router.get('/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, fingerprint, expiresAt, session, redirectTo, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                user = req.user;
                if (!user) {
                    logger_1.logger.warn('OAuth callback received without user data');
                    return [2 /*return*/, res.redirect('/login?error=oauth_failed')];
                }
                fingerprint = fingerprint_1.FingerprintService.generateFingerprint(req);
                expiresAt = new Date(Date.now() + config_1.appConfig.security.sessionTimeout);
                return [4 /*yield*/, Session_1.SessionModel.create({
                        user_id: user.id,
                        token: req.sessionID,
                        expires_at: expiresAt,
                        ip_address: fingerprint.ip,
                        user_agent: fingerprint.userAgent,
                    })];
            case 1:
                session = _a.sent();
                // Set session data
                req.session.userId = user.id;
                req.session.isAuthenticated = true;
                req.session.fingerprint = fingerprint;
                req.session.trustScore = 0.8; // Higher trust for OAuth
                req.session.lastActivity = new Date();
                // Log successful OAuth login
                return [4 /*yield*/, AuditLog_1.AuditLogModel.create({
                        user_id: user.id,
                        action: 'oauth_login',
                        resource_type: 'user',
                        resource_id: user.id,
                        details: {
                            provider: 'google',
                            ip_address: fingerprint.ip,
                            user_agent: fingerprint.userAgent,
                            session_id: req.sessionID,
                        },
                    })];
            case 2:
                // Log successful OAuth login
                _a.sent();
                logger_1.logger.info('Google OAuth login successful', {
                    userId: user.id,
                    email: user.email,
                    sessionId: req.sessionID,
                });
                redirectTo = req.session.returnTo || '/dashboard';
                delete req.session.returnTo;
                res.redirect(redirectTo);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                logger_1.logger.error('Error in Google OAuth callback', { error: error_1 });
                res.redirect('/login?error=oauth_callback_error');
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// GitHub OAuth routes
router.get('/github', passport_1.default.authenticate('github', {
    scope: ['user:email']
}));
router.get('/github/callback', passport_1.default.authenticate('github', { failureRedirect: '/login?error=oauth_failed' }), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, fingerprint, expiresAt, session, redirectTo, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                user = req.user;
                if (!user) {
                    logger_1.logger.warn('OAuth callback received without user data');
                    return [2 /*return*/, res.redirect('/login?error=oauth_failed')];
                }
                fingerprint = fingerprint_1.FingerprintService.generateFingerprint(req);
                expiresAt = new Date(Date.now() + config_1.appConfig.security.sessionTimeout);
                return [4 /*yield*/, Session_1.SessionModel.create({
                        user_id: user.id,
                        token: req.sessionID,
                        expires_at: expiresAt,
                        ip_address: fingerprint.ip,
                        user_agent: fingerprint.userAgent,
                    })];
            case 1:
                session = _a.sent();
                // Set session data
                req.session.userId = user.id;
                req.session.isAuthenticated = true;
                req.session.fingerprint = fingerprint;
                req.session.trustScore = 0.8; // Higher trust for OAuth
                req.session.lastActivity = new Date();
                // Log successful OAuth login
                return [4 /*yield*/, AuditLog_1.AuditLogModel.create({
                        user_id: user.id,
                        action: 'oauth_login',
                        resource_type: 'user',
                        resource_id: user.id,
                        details: {
                            provider: 'github',
                            ip_address: fingerprint.ip,
                            user_agent: fingerprint.userAgent,
                            session_id: req.sessionID,
                        },
                    })];
            case 2:
                // Log successful OAuth login
                _a.sent();
                logger_1.logger.info('GitHub OAuth login successful', {
                    userId: user.id,
                    email: user.email,
                    sessionId: req.sessionID,
                });
                redirectTo = req.session.returnTo || '/dashboard';
                delete req.session.returnTo;
                res.redirect(redirectTo);
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                logger_1.logger.error('Error in GitHub OAuth callback', { error: error_2 });
                res.redirect('/login?error=oauth_callback_error');
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// OAuth account linking routes (for authenticated users)
router.get('/link/google', function (req, res, next) {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}, passport_1.default.authenticate('google', {
    scope: ['profile', 'email'],
    state: 'link_account',
}));
router.get('/link/github', function (req, res, next) {
    if (!req.session.isAuthenticated) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}, passport_1.default.authenticate('github', {
    scope: ['user:email'],
    state: 'link_account',
}));
// OAuth account unlinking routes
router.post('/unlink/:provider', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var provider, userId, UserModel, unlinked, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                if (!req.session.isAuthenticated || !req.session.userId) {
                    return [2 /*return*/, res.status(401).json({ error: 'Authentication required' })];
                }
                provider = req.params.provider;
                userId = req.session.userId;
                if (!['google', 'github'].includes(provider)) {
                    return [2 /*return*/, res.status(400).json({ error: 'Invalid OAuth provider' })];
                }
                return [4 /*yield*/, Promise.resolve().then(function () { return require('../models/User'); })];
            case 1:
                UserModel = (_a.sent()).UserModel;
                return [4 /*yield*/, UserModel.unlinkOAuthAccount(userId, provider)];
            case 2:
                unlinked = _a.sent();
                if (!unlinked) return [3 /*break*/, 4];
                // Log account unlinking
                return [4 /*yield*/, AuditLog_1.AuditLogModel.create({
                        user_id: userId,
                        action: 'oauth_unlink',
                        resource_type: 'user',
                        resource_id: userId,
                        details: {
                            provider: provider,
                            ip_address: fingerprint_1.FingerprintService.generateFingerprint(req).ip,
                        },
                    })];
            case 3:
                // Log account unlinking
                _a.sent();
                logger_1.logger.info('OAuth account unlinked', { userId: userId, provider: provider });
                res.json({ message: 'Account unlinked successfully' });
                return [3 /*break*/, 5];
            case 4:
                res.status(404).json({ error: 'OAuth account not found' });
                _a.label = 5;
            case 5: return [3 /*break*/, 7];
            case 6:
                error_3 = _a.sent();
                logger_1.logger.error('Error unlinking OAuth account', { error: error_3 });
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
// Get user's OAuth accounts
router.get('/accounts', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, UserModel, oauthAccounts, sanitizedAccounts, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                if (!req.session.isAuthenticated || !req.session.userId) {
                    return [2 /*return*/, res.status(401).json({ error: 'Authentication required' })];
                }
                userId = req.session.userId;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('../models/User'); })];
            case 1:
                UserModel = (_a.sent()).UserModel;
                return [4 /*yield*/, UserModel.getOAuthAccounts(userId)];
            case 2:
                oauthAccounts = _a.sent();
                sanitizedAccounts = oauthAccounts.map(function (account) {
                    var _a, _b;
                    return ({
                        provider: account.provider,
                        provider_id: account.provider_id,
                        created_at: account.created_at,
                        profile_data: {
                            displayName: account.profile_data.displayName,
                            username: account.profile_data.username,
                            email: (_b = (_a = account.profile_data.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value,
                        },
                    });
                });
                res.json({ accounts: sanitizedAccounts });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                logger_1.logger.error('Error getting OAuth accounts', { error: error_4 });
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// OAuth status endpoint
router.get('/status', function (req, res) {
    var isConfigured = {
        google: !!(config_1.appConfig.oauth.google.clientId && config_1.appConfig.oauth.google.clientSecret),
        github: !!(config_1.appConfig.oauth.github.clientId && config_1.appConfig.oauth.github.clientSecret),
    };
    res.json({
        configured: isConfigured,
        available: Object.keys(isConfigured).filter(function (provider) { return isConfigured[provider]; }),
    });
});
exports.default = router;
