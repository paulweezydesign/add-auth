"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FingerprintService = void 0;
var crypto_1 = require("crypto");
var logger_1 = require("./logger");
var FingerprintService = /** @class */ (function () {
    function FingerprintService() {
    }
    /**
     * Generate a device fingerprint from request headers
     */
    FingerprintService.generateFingerprint = function (req) {
        var _a;
        var ip = this.getClientIP(req);
        var userAgent = req.get('user-agent') || '';
        var acceptLanguage = req.get('accept-language');
        var acceptEncoding = req.get('accept-encoding');
        // Create a hash of the fingerprint components
        var fingerprintData = {
            ip: ip,
            userAgent: userAgent,
            acceptLanguage: acceptLanguage,
            acceptEncoding: acceptEncoding,
        };
        var hash = crypto_1.default
            .createHash('sha256')
            .update(JSON.stringify(fingerprintData))
            .digest('hex');
        var fingerprint = {
            hash: hash,
            ip: ip,
            userAgent: userAgent,
            acceptLanguage: acceptLanguage,
            acceptEncoding: acceptEncoding,
            timestamp: new Date(),
        };
        logger_1.logger.debug('Generated device fingerprint', {
            hash: fingerprint.hash,
            ip: fingerprint.ip,
            userAgent: ((_a = fingerprint.userAgent) === null || _a === void 0 ? void 0 : _a.substring(0, 50)) + '...',
        });
        return fingerprint;
    };
    /**
     * Validate a current fingerprint against a stored one
     */
    FingerprintService.validateFingerprint = function (currentFingerprint, storedFingerprint) {
        var changes = [];
        var risk = 'low';
        var recommendations = [];
        // Check IP address change
        if (currentFingerprint.ip !== storedFingerprint.ip) {
            changes.push('IP address changed');
            risk = 'medium';
            recommendations.push('Consider requiring re-authentication');
        }
        // Check User-Agent change
        if (currentFingerprint.userAgent !== storedFingerprint.userAgent) {
            changes.push('User-Agent changed');
            risk = 'high';
            recommendations.push('Require immediate re-authentication');
        }
        // Check Accept-Language change
        if (currentFingerprint.acceptLanguage !== storedFingerprint.acceptLanguage) {
            changes.push('Accept-Language changed');
            if (risk === 'low')
                risk = 'medium';
            recommendations.push('Monitor for suspicious activity');
        }
        // Check Accept-Encoding change
        if (currentFingerprint.acceptEncoding !== storedFingerprint.acceptEncoding) {
            changes.push('Accept-Encoding changed');
            if (risk === 'low')
                risk = 'medium';
        }
        var isValid = changes.length === 0 ||
            (changes.length === 1 && changes[0] === 'IP address changed');
        logger_1.logger.info('Fingerprint validation completed', {
            currentHash: currentFingerprint.hash,
            storedHash: storedFingerprint.hash,
            isValid: isValid,
            risk: risk,
            changes: changes,
        });
        return {
            isValid: isValid,
            risk: risk,
            changes: changes,
            recommendations: recommendations,
        };
    };
    /**
     * Get the real client IP address from request
     */
    FingerprintService.getClientIP = function (req) {
        var forwarded = req.get('x-forwarded-for');
        var realIP = req.get('x-real-ip');
        var connectingIP = req.get('x-connecting-ip');
        if (forwarded) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return forwarded.split(',')[0].trim();
        }
        if (realIP) {
            return realIP;
        }
        if (connectingIP) {
            return connectingIP;
        }
        return req.connection.remoteAddress || req.socket.remoteAddress || req.ip || 'unknown';
    };
    /**
     * Create a secure session token with fingerprint binding
     */
    FingerprintService.createSecureSessionToken = function (userId, fingerprint) {
        var tokenData = {
            userId: userId,
            fingerprintHash: fingerprint.hash,
            timestamp: Date.now(),
            nonce: crypto_1.default.randomBytes(16).toString('hex'),
        };
        var token = crypto_1.default
            .createHash('sha256')
            .update(JSON.stringify(tokenData))
            .digest('hex');
        return token;
    };
    /**
     * Check if fingerprint indicates potential session hijacking
     */
    FingerprintService.detectSessionHijacking = function (currentFingerprint, storedFingerprint) {
        var _a, _b;
        // High-risk indicators
        var userAgentChanged = currentFingerprint.userAgent !== storedFingerprint.userAgent;
        var significantIPChange = this.isSignificantIPChange(currentFingerprint.ip, storedFingerprint.ip);
        // If both critical components changed, it's likely hijacking
        if (userAgentChanged && significantIPChange) {
            logger_1.logger.warn('Potential session hijacking detected', {
                currentIP: currentFingerprint.ip,
                storedIP: storedFingerprint.ip,
                currentUA: (_a = currentFingerprint.userAgent) === null || _a === void 0 ? void 0 : _a.substring(0, 50),
                storedUA: (_b = storedFingerprint.userAgent) === null || _b === void 0 ? void 0 : _b.substring(0, 50),
            });
            return true;
        }
        return false;
    };
    /**
     * Check if IP change is significant (different subnets)
     */
    FingerprintService.isSignificantIPChange = function (currentIP, storedIP) {
        // Simple check for IPv4 - same /24 subnet
        if (currentIP.includes('.') && storedIP.includes('.')) {
            var currentParts = currentIP.split('.');
            var storedParts = storedIP.split('.');
            // If first 3 octets are the same, it's likely the same network
            return !(currentParts[0] === storedParts[0] &&
                currentParts[1] === storedParts[1] &&
                currentParts[2] === storedParts[2]);
        }
        // For IPv6 or other cases, any change is significant
        return currentIP !== storedIP;
    };
    /**
     * Generate a device trust score based on fingerprint history
     */
    FingerprintService.calculateTrustScore = function (fingerprintHistory, currentFingerprint) {
        if (fingerprintHistory.length === 0) {
            return 0.5; // Neutral score for new devices
        }
        var trustScore = 1.0;
        var consistentSessions = 0;
        for (var _i = 0, fingerprintHistory_1 = fingerprintHistory; _i < fingerprintHistory_1.length; _i++) {
            var historical = fingerprintHistory_1[_i];
            var validation = this.validateFingerprint(currentFingerprint, historical);
            if (validation.isValid) {
                consistentSessions++;
            }
            else {
                // Reduce trust based on risk level
                switch (validation.risk) {
                    case 'low':
                        trustScore -= 0.1;
                        break;
                    case 'medium':
                        trustScore -= 0.3;
                        break;
                    case 'high':
                        trustScore -= 0.5;
                        break;
                }
            }
        }
        // Boost trust for consistent fingerprints
        var consistencyRatio = consistentSessions / fingerprintHistory.length;
        trustScore = Math.max(0, Math.min(1, trustScore * consistencyRatio));
        logger_1.logger.debug('Calculated device trust score', {
            fingerprintHash: currentFingerprint.hash,
            trustScore: trustScore,
            consistentSessions: consistentSessions,
            totalSessions: fingerprintHistory.length,
        });
        return trustScore;
    };
    FingerprintService.CRITICAL_HEADERS = ['user-agent', 'accept-language'];
    FingerprintService.MONITORED_HEADERS = ['accept-encoding', 'x-forwarded-for'];
    return FingerprintService;
}());
exports.FingerprintService = FingerprintService;
exports.default = FingerprintService;
