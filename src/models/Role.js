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
exports.RoleModel = void 0;
var uuid_1 = require("uuid");
var connection_1 = require("../database/connection");
var logger_1 = require("../utils/logger");
var RoleModel = /** @class */ (function () {
    function RoleModel() {
    }
    RoleModel.create = function (input, client) {
        return __awaiter(this, void 0, void 0, function () {
            var id, now, query, values, result, _a, role, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        id = (0, uuid_1.v4)();
                        now = new Date();
                        query = "\n      INSERT INTO roles (id, name, description, permissions, created_at, updated_at)\n      VALUES ($1, $2, $3, $4, $5, $6)\n      RETURNING *\n    ";
                        values = [
                            id,
                            input.name,
                            input.description || null,
                            JSON.stringify(input.permissions),
                            now,
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
                        role = result.rows[0];
                        role.permissions = JSON.parse(role.permissions);
                        logger_1.logger.info('Role created successfully', { roleId: id, name: input.name });
                        return [2 /*return*/, role];
                    case 6:
                        error_1 = _b.sent();
                        logger_1.logger.error('Error creating role', { name: input.name, error: error_1 });
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RoleModel.findById = function (id, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, role, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "SELECT * FROM roles WHERE id = $1";
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
                        role = result.rows[0];
                        if (role) {
                            role.permissions = JSON.parse(role.permissions);
                        }
                        return [2 /*return*/, role || null];
                    case 6:
                        error_2 = _b.sent();
                        logger_1.logger.error('Error finding role by ID', { roleId: id, error: error_2 });
                        throw error_2;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RoleModel.findByName = function (name, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, role, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "SELECT * FROM roles WHERE name = $1";
                        values = [name];
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
                        role = result.rows[0];
                        if (role) {
                            role.permissions = JSON.parse(role.permissions);
                        }
                        return [2 /*return*/, role || null];
                    case 6:
                        error_3 = _b.sent();
                        logger_1.logger.error('Error finding role by name', { name: name, error: error_3 });
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RoleModel.findAll = function (client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result, _a, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "SELECT * FROM roles ORDER BY name";
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
                        return [2 /*return*/, result.rows.map(function (role) { return (__assign(__assign({}, role), { permissions: JSON.parse(role.permissions) })); })];
                    case 6:
                        error_4 = _b.sent();
                        logger_1.logger.error('Error finding all roles', { error: error_4 });
                        throw error_4;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RoleModel.update = function (id, input, client) {
        return __awaiter(this, void 0, void 0, function () {
            var fields, values, paramIndex, query, result, _a, role, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        fields = [];
                        values = [];
                        paramIndex = 1;
                        if (input.name !== undefined) {
                            fields.push("name = $".concat(paramIndex++));
                            values.push(input.name);
                        }
                        if (input.description !== undefined) {
                            fields.push("description = $".concat(paramIndex++));
                            values.push(input.description);
                        }
                        if (input.permissions !== undefined) {
                            fields.push("permissions = $".concat(paramIndex++));
                            values.push(JSON.stringify(input.permissions));
                        }
                        if (!(fields.length === 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.findById(id, client)];
                    case 1: return [2 /*return*/, _b.sent()];
                    case 2:
                        fields.push("updated_at = $".concat(paramIndex++));
                        values.push(new Date());
                        values.push(id);
                        query = "\n      UPDATE roles \n      SET ".concat(fields.join(', '), " \n      WHERE id = $").concat(paramIndex, "\n      RETURNING *\n    ");
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
                        role = result.rows[0];
                        if (role) {
                            role.permissions = JSON.parse(role.permissions);
                            logger_1.logger.info('Role updated successfully', { roleId: id });
                        }
                        return [2 /*return*/, role || null];
                    case 8:
                        error_5 = _b.sent();
                        logger_1.logger.error('Error updating role', { roleId: id, error: error_5 });
                        throw error_5;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    RoleModel.delete = function (id, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, deleted, error_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "DELETE FROM roles WHERE id = $1";
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
                        deleted = result.rowCount > 0;
                        if (deleted) {
                            logger_1.logger.info('Role deleted successfully', { roleId: id });
                        }
                        return [2 /*return*/, deleted];
                    case 6:
                        error_6 = _b.sent();
                        logger_1.logger.error('Error deleting role', { roleId: id, error: error_6 });
                        throw error_6;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RoleModel.assignToUser = function (input, client) {
        return __awaiter(this, void 0, void 0, function () {
            var now, query, values, result, _a, error_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        now = new Date();
                        query = "\n      INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)\n      VALUES ($1, $2, $3, $4)\n      ON CONFLICT (user_id, role_id) \n      DO UPDATE SET assigned_at = $3, assigned_by = $4\n      RETURNING *\n    ";
                        values = [
                            input.user_id,
                            input.role_id,
                            now,
                            input.assigned_by,
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
                        logger_1.logger.info('Role assigned to user', {
                            userId: input.user_id,
                            roleId: input.role_id,
                            assignedBy: input.assigned_by
                        });
                        return [2 /*return*/, result.rows[0]];
                    case 6:
                        error_7 = _b.sent();
                        logger_1.logger.error('Error assigning role to user', {
                            userId: input.user_id,
                            roleId: input.role_id,
                            error: error_7
                        });
                        throw error_7;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RoleModel.removeFromUser = function (userId, roleId, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, removed, error_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2";
                        values = [userId, roleId];
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
                        removed = result.rowCount > 0;
                        if (removed) {
                            logger_1.logger.info('Role removed from user', { userId: userId, roleId: roleId });
                        }
                        return [2 /*return*/, removed];
                    case 6:
                        error_8 = _b.sent();
                        logger_1.logger.error('Error removing role from user', { userId: userId, roleId: roleId, error: error_8 });
                        throw error_8;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RoleModel.getUserRoles = function (userId, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, error_9;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT r.* FROM roles r\n      JOIN user_roles ur ON r.id = ur.role_id\n      WHERE ur.user_id = $1\n      ORDER BY r.name\n    ";
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
                        return [2 /*return*/, result.rows.map(function (role) { return (__assign(__assign({}, role), { permissions: JSON.parse(role.permissions) })); })];
                    case 6:
                        error_9 = _b.sent();
                        logger_1.logger.error('Error getting user roles', { userId: userId, error: error_9 });
                        throw error_9;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RoleModel.getRoleUsers = function (roleId, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, error_10;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT user_id FROM user_roles \n      WHERE role_id = $1\n    ";
                        values = [roleId];
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
                        return [2 /*return*/, result.rows.map(function (row) { return row.user_id; })];
                    case 6:
                        error_10 = _b.sent();
                        logger_1.logger.error('Error getting role users', { roleId: roleId, error: error_10 });
                        throw error_10;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RoleModel.getUserPermissions = function (userId, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, error_11;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT DISTINCT jsonb_array_elements_text(r.permissions::jsonb) as permission\n      FROM roles r\n      JOIN user_roles ur ON r.id = ur.role_id\n      WHERE ur.user_id = $1\n    ";
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
                        return [2 /*return*/, result.rows.map(function (row) { return row.permission; })];
                    case 6:
                        error_11 = _b.sent();
                        logger_1.logger.error('Error getting user permissions', { userId: userId, error: error_11 });
                        throw error_11;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    RoleModel.hasPermission = function (userId, permission, client) {
        return __awaiter(this, void 0, void 0, function () {
            var query, values, result, _a, error_12;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = "\n      SELECT EXISTS(\n        SELECT 1 FROM roles r\n        JOIN user_roles ur ON r.id = ur.role_id\n        WHERE ur.user_id = $1 AND r.permissions::jsonb ? $2\n      ) as has_permission\n    ";
                        values = [userId, permission];
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
                        return [2 /*return*/, result.rows[0].has_permission];
                    case 6:
                        error_12 = _b.sent();
                        logger_1.logger.error('Error checking user permission', { userId: userId, permission: permission, error: error_12 });
                        throw error_12;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return RoleModel;
}());
exports.RoleModel = RoleModel;
