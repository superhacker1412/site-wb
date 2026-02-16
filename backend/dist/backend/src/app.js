"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const routes_1 = require("./routes");
const error_handler_1 = require("./middleware/error-handler");
exports.app = (0, express_1.default)();
const allowedOrigins = env_1.env.CLIENT_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
exports.app.disable("x-powered-by");
exports.app.set("trust proxy", env_1.env.TRUST_PROXY);
exports.app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
}));
exports.app.use((0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    limit: env_1.env.RATE_LIMIT_MAX,
    standardHeaders: "draft-7",
    legacyHeaders: false,
}));
exports.app.use((0, morgan_1.default)("dev"));
exports.app.use(express_1.default.json({ limit: "2mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true }));
exports.app.use((0, cookie_parser_1.default)());
exports.app.use("/uploads", express_1.default.static(path_1.default.resolve(process.cwd(), "uploads"), {
    dotfiles: "deny",
    index: false,
    maxAge: env_1.env.NODE_ENV === "production" ? "7d" : 0,
    setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
    },
}));
exports.app.use("/api/v1", routes_1.apiRouter);
exports.app.use(error_handler_1.notFound);
exports.app.use(error_handler_1.errorHandler);
//# sourceMappingURL=app.js.map