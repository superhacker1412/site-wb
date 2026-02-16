"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const errors_1 = require("../../lib/errors");
const async_handler_1 = require("../../lib/async-handler");
const security_1 = require("../../lib/security");
const env_1 = require("../../config/env");
const auth_1 = require("../../middleware/auth");
const csrf_1 = require("../../middleware/csrf");
const rate_limits_1 = require("../../middleware/rate-limits");
const validate_1 = require("../../middleware/validate");
const passwordSchema = zod_1.z
    .string()
    .min(8)
    .max(128)
    .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
    message: "Password must contain at least one letter and one number",
});
const registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().trim().min(2).max(80),
    lastName: zod_1.z.string().trim().min(2).max(80),
    middleName: zod_1.z.string().trim().min(2).max(80),
    regionId: zod_1.z.string().trim().min(1),
    cityId: zod_1.z.string().trim().min(1).optional().nullable(),
    districtId: zod_1.z.string().trim().min(1).optional().nullable(),
    customDistrictName: zod_1.z.string().trim().min(2).max(180).optional().nullable(),
    schoolId: zod_1.z.string().trim().min(1).optional().nullable(),
    customSchoolName: zod_1.z.string().trim().min(2).max(180).optional().nullable(),
    gradeNumber: zod_1.z.number().int().min(1).max(11),
    gradeLetter: zod_1.z
        .string()
        .trim()
        .min(1)
        .max(5)
        .transform((value) => value.toUpperCase()),
    email: zod_1.z.string().email().toLowerCase(),
    password: passwordSchema,
}).refine((value) => Boolean(value.districtId) || Boolean(value.customDistrictName), {
    message: "Select district or provide custom district name",
    path: ["districtId"],
}).refine((value) => Boolean(value.schoolId) || Boolean(value.customSchoolName), {
    message: "Select school or provide custom school name",
    path: ["schoolId"],
});
const loginSchema = zod_1.z.object({
    login: zod_1.z.string().trim().min(2).max(120).toLowerCase(),
    password: zod_1.z.string().min(8).max(128),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(8).max(128),
    newPassword: passwordSchema,
});
const safeUserSelect = {
    id: true,
    name: true,
    firstName: true,
    lastName: true,
    middleName: true,
    email: true,
    role: true,
    status: true,
    regionId: true,
    cityId: true,
    districtId: true,
    customDistrictName: true,
    schoolId: true,
    customSchoolName: true,
    gradeNumber: true,
    gradeLetter: true,
    region: {
        select: {
            id: true,
            name: true,
        },
    },
    city: {
        select: {
            id: true,
            name: true,
        },
    },
    district: {
        select: {
            id: true,
            name: true,
        },
    },
    school: {
        select: {
            id: true,
            name: true,
        },
    },
    createdAt: true,
    updatedAt: true,
};
async function createSession(params) {
    const accessToken = (0, security_1.signAccessToken)({
        sub: params.userId,
        email: params.email,
        role: params.role,
    });
    const refreshToken = (0, security_1.signRefreshToken)(params.userId);
    const csrfToken = (0, security_1.generateCsrfToken)();
    await prisma_1.prisma.refreshToken.create({
        data: {
            userId: params.userId,
            tokenHash: (0, security_1.hashToken)(refreshToken),
            expiresAt: (0, security_1.tokenExpiresAt)(env_1.env.REFRESH_TOKEN_DAYS),
            ip: params.ip || null,
            userAgent: params.userAgent || null,
        },
    });
    (0, security_1.setAuthCookies)(params.res, accessToken, refreshToken, csrfToken);
}
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/register", rate_limits_1.registerRateLimiter, (0, validate_1.validateBody)(registerSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { firstName, lastName, middleName, regionId, cityId, districtId, customDistrictName, schoolId, customSchoolName, gradeNumber, gradeLetter, email, password, } = req.body;
    const normalizedCityId = cityId || null;
    const normalizedDistrictId = districtId || null;
    const normalizedCustomDistrictName = customDistrictName?.trim() || null;
    const normalizedSchoolId = schoolId || null;
    const normalizedCustomSchoolName = customSchoolName?.trim() || null;
    const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (existing)
        throw new errors_1.AppError("Email already exists", 409);
    const [region, city, district, school] = await Promise.all([
        prisma_1.prisma.region.findUnique({
            where: { id: regionId },
            select: { id: true, status: true },
        }),
        normalizedCityId
            ? prisma_1.prisma.city.findUnique({
                where: { id: normalizedCityId },
                select: { id: true, regionId: true, status: true },
            })
            : Promise.resolve(null),
        normalizedDistrictId
            ? prisma_1.prisma.district.findUnique({
                where: { id: normalizedDistrictId },
                select: { id: true, regionId: true, cityId: true, status: true },
            })
            : Promise.resolve(null),
        normalizedSchoolId
            ? prisma_1.prisma.school.findUnique({
                where: { id: normalizedSchoolId },
                select: { id: true, districtId: true, status: true },
            })
            : Promise.resolve(null),
    ]);
    if (!region || region.status !== "ACTIVE")
        throw new errors_1.AppError("Region not found", 400);
    if (normalizedDistrictId) {
        if (!district || district.status !== "ACTIVE")
            throw new errors_1.AppError("District not found", 400);
        if (district.regionId !== regionId)
            throw new errors_1.AppError("District does not belong to selected region", 400);
    }
    else if (!normalizedCustomDistrictName) {
        throw new errors_1.AppError("District is required", 400);
    }
    if (city) {
        if (city.status !== "ACTIVE")
            throw new errors_1.AppError("City not found", 400);
        if (city.regionId !== regionId)
            throw new errors_1.AppError("City does not belong to selected region", 400);
        if (district && district.cityId && district.cityId !== city.id) {
            throw new errors_1.AppError("District does not belong to selected city", 400);
        }
    }
    if (school) {
        if (!normalizedDistrictId) {
            throw new errors_1.AppError("School can be selected only with existing district", 400);
        }
        if (school.status !== "ACTIVE")
            throw new errors_1.AppError("School not found", 400);
        if (school.districtId !== normalizedDistrictId) {
            throw new errors_1.AppError("School does not belong to selected district", 400);
        }
    }
    if (!normalizedSchoolId && !normalizedCustomSchoolName) {
        throw new errors_1.AppError("School is required", 400);
    }
    const composedName = `${lastName} ${firstName} ${middleName}`.replace(/\s+/g, " ").trim();
    const passwordHash = await (0, security_1.hashPassword)(password);
    const user = await prisma_1.prisma.user.create({
        data: {
            name: composedName,
            firstName,
            lastName,
            middleName,
            regionId,
            cityId: normalizedCityId,
            districtId: normalizedDistrictId,
            customDistrictName: normalizedDistrictId ? null : normalizedCustomDistrictName,
            schoolId: normalizedSchoolId,
            customSchoolName: normalizedSchoolId ? null : normalizedCustomSchoolName,
            gradeNumber,
            gradeLetter,
            email,
            passwordHash,
        },
        select: safeUserSelect,
    });
    await createSession({
        userId: user.id,
        email: user.email,
        role: user.role,
        res,
        ip: req.ip,
        userAgent: req.get("user-agent"),
    });
    res.status(201).json({ user });
}));
exports.authRouter.post("/login", rate_limits_1.loginRateLimiter, (0, validate_1.validateBody)(loginSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { login, password } = req.body;
    const user = await prisma_1.prisma.user.findFirst({
        where: {
            OR: [{ email: login }, { name: { equals: login, mode: "insensitive" } }],
        },
        select: {
            ...safeUserSelect,
            passwordHash: true,
        },
    });
    if (!user)
        throw new errors_1.AppError("Invalid login or password", 401);
    if (user.status === "ARCHIVED")
        throw new errors_1.AppError("Account is archived", 403);
    const isValid = await (0, security_1.verifyPassword)(password, user.passwordHash);
    if (!isValid)
        throw new errors_1.AppError("Invalid login or password", 401);
    await createSession({
        userId: user.id,
        email: user.email,
        role: user.role,
        res,
        ip: req.ip,
        userAgent: req.get("user-agent"),
    });
    const { passwordHash: _passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
}));
exports.authRouter.post("/refresh", rate_limits_1.refreshRateLimiter, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.cookies?.[security_1.REFRESH_COOKIE];
    if (!refreshToken)
        throw new errors_1.AppError("Refresh token is missing", 401);
    (0, security_1.verifyRefreshToken)(refreshToken);
    const tokenHash = (0, security_1.hashToken)(refreshToken);
    const storedToken = await prisma_1.prisma.refreshToken.findUnique({
        where: { tokenHash },
        select: {
            id: true,
            expiresAt: true,
            revokedAt: true,
            user: {
                select: safeUserSelect,
            },
        },
    });
    if (!storedToken)
        throw new errors_1.AppError("Invalid refresh token", 401);
    if (storedToken.revokedAt)
        throw new errors_1.AppError("Refresh token revoked", 401);
    if (storedToken.expiresAt < new Date())
        throw new errors_1.AppError("Refresh token expired", 401);
    if (storedToken.user.status === "ARCHIVED")
        throw new errors_1.AppError("Account is archived", 403);
    await prisma_1.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
    });
    await createSession({
        userId: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
        res,
        ip: req.ip,
        userAgent: req.get("user-agent"),
    });
    res.json({
        user: storedToken.user,
    });
}));
exports.authRouter.post("/logout", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const refreshToken = req.cookies?.[security_1.REFRESH_COOKIE];
    if (refreshToken) {
        const tokenHash = (0, security_1.hashToken)(refreshToken);
        await prisma_1.prisma.refreshToken.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    (0, security_1.clearAuthCookies)(res);
    res.status(204).send();
}));
exports.authRouter.get("/me", auth_1.authenticate, (0, async_handler_1.asyncHandler)(async (req, res) => {
    res.json({ user: req.user });
}));
exports.authRouter.post("/change-password", auth_1.authenticate, csrf_1.requireCsrf, (0, validate_1.validateBody)(changePasswordSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    if (currentPassword === newPassword) {
        throw new errors_1.AppError("New password must be different from current password", 400);
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, passwordHash: true },
    });
    if (!user)
        throw new errors_1.AppError("User not found", 404);
    const currentValid = await (0, security_1.verifyPassword)(currentPassword, user.passwordHash);
    if (!currentValid)
        throw new errors_1.AppError("Current password is incorrect", 400);
    const passwordHash = await (0, security_1.hashPassword)(newPassword);
    await prisma_1.prisma.$transaction([
        prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        }),
        prisma_1.prisma.refreshToken.updateMany({
            where: { userId: user.id, revokedAt: null },
            data: { revokedAt: new Date() },
        }),
    ]);
    (0, security_1.clearAuthCookies)(res);
    res.status(204).send();
}));
exports.authRouter.get("/csrf", auth_1.authenticate, (0, async_handler_1.asyncHandler)(async (req, res) => {
    // Accessed by the client if it needs to restore CSRF state manually.
    const csrfToken = req.cookies?.csrf_token;
    res.json({ csrfToken: csrfToken || null });
}));
exports.authRouter.post("/logout-all", auth_1.authenticate, csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    await prisma_1.prisma.refreshToken.updateMany({
        where: { userId: req.user.id, revokedAt: null },
        data: { revokedAt: new Date() },
    });
    (0, security_1.clearAuthCookies)(res);
    res.status(204).send();
}));
//# sourceMappingURL=auth.router.js.map