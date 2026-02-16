"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSRF_COOKIE = exports.REFRESH_COOKIE = exports.ACCESS_COOKIE = void 0;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.hashToken = hashToken;
exports.generateCsrfToken = generateCsrfToken;
exports.setAuthCookies = setAuthCookies;
exports.clearAuthCookies = clearAuthCookies;
exports.tokenExpiresAt = tokenExpiresAt;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
exports.ACCESS_COOKIE = "access_token";
exports.REFRESH_COOKIE = "refresh_token";
exports.CSRF_COOKIE = "csrf_token";
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, env_1.env.BCRYPT_ROUNDS);
}
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign({ ...payload, type: "access" }, env_1.env.JWT_ACCESS_SECRET, { expiresIn: `${env_1.env.ACCESS_TOKEN_MINUTES}m` });
}
function signRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({
        sub: userId,
        type: "refresh",
        jti: crypto_1.default.randomUUID(),
    }, env_1.env.JWT_REFRESH_SECRET, { expiresIn: `${env_1.env.REFRESH_TOKEN_DAYS}d` });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
}
function hashToken(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
function generateCsrfToken() {
    return crypto_1.default.randomBytes(24).toString("hex");
}
function setAuthCookies(res, accessToken, refreshToken, csrfToken) {
    const isSecure = env_1.env.NODE_ENV === "production";
    const sameSite = "strict";
    res.cookie(exports.ACCESS_COOKIE, accessToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite,
        maxAge: env_1.env.ACCESS_TOKEN_MINUTES * 60 * 1000,
        path: "/",
    });
    res.cookie(exports.REFRESH_COOKIE, refreshToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite,
        maxAge: env_1.env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
        path: "/",
    });
    res.cookie(exports.CSRF_COOKIE, csrfToken, {
        httpOnly: false,
        secure: isSecure,
        sameSite,
        maxAge: env_1.env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
        path: "/",
    });
}
function clearAuthCookies(res) {
    const isSecure = env_1.env.NODE_ENV === "production";
    const sameSite = "strict";
    res.clearCookie(exports.ACCESS_COOKIE, { path: "/", secure: isSecure, sameSite });
    res.clearCookie(exports.REFRESH_COOKIE, { path: "/", secure: isSecure, sameSite });
    res.clearCookie(exports.CSRF_COOKIE, { path: "/", secure: isSecure, sameSite });
}
function tokenExpiresAt(days) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
//# sourceMappingURL=security.js.map