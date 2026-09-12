"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
var winston_1 = require("winston");
var config_1 = require("../config");
var logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
var developmentFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(function (_a) {
    var timestamp = _a.timestamp, level = _a.level, message = _a.message, meta = __rest(_a, ["timestamp", "level", "message"]);
    return "".concat(timestamp, " ").concat(level, ": ").concat(message, " ").concat(Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '');
}));
exports.logger = winston_1.default.createLogger({
    level: config_1.appConfig.logging.level,
    format: config_1.appConfig.server.nodeEnv === 'production' ? logFormat : developmentFormat,
    defaultMeta: { service: 'add-auth' },
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
    ],
});
// Create logs directory if it doesn't exist
var fs_1 = require("fs");
if (!(0, fs_1.existsSync)('logs')) {
    (0, fs_1.mkdirSync)('logs');
}
exports.default = exports.logger;
