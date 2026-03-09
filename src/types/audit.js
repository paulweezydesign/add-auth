"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceTypes = exports.AuditActions = void 0;
var AuditActions;
(function (AuditActions) {
    // Authentication
    AuditActions["LOGIN"] = "login";
    AuditActions["LOGOUT"] = "logout";
    AuditActions["LOGIN_FAILED"] = "login_failed";
    AuditActions["PASSWORD_CHANGE"] = "password_change";
    AuditActions["PASSWORD_RESET"] = "password_reset";
    // User Management
    AuditActions["USER_CREATE"] = "user_create";
    AuditActions["USER_UPDATE"] = "user_update";
    AuditActions["USER_DELETE"] = "user_delete";
    AuditActions["USER_SUSPEND"] = "user_suspend";
    AuditActions["USER_ACTIVATE"] = "user_activate";
    // Role Management
    AuditActions["ROLE_ASSIGN"] = "role_assign";
    AuditActions["ROLE_REVOKE"] = "role_revoke";
    AuditActions["ROLE_CREATE"] = "role_create";
    AuditActions["ROLE_UPDATE"] = "role_update";
    AuditActions["ROLE_DELETE"] = "role_delete";
    // Session Management
    AuditActions["SESSION_CREATE"] = "session_create";
    AuditActions["SESSION_INVALIDATE"] = "session_invalidate";
    AuditActions["SESSION_EXTEND"] = "session_extend";
})(AuditActions || (exports.AuditActions = AuditActions = {}));
var ResourceTypes;
(function (ResourceTypes) {
    ResourceTypes["USER"] = "user";
    ResourceTypes["ROLE"] = "role";
    ResourceTypes["SESSION"] = "session";
    ResourceTypes["SYSTEM"] = "system";
})(ResourceTypes || (exports.ResourceTypes = ResourceTypes = {}));
