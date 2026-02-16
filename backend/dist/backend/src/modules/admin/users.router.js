"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUsersRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const async_handler_1 = require("../../lib/async-handler");
const errors_1 = require("../../lib/errors");
const quiz_options_1 = require("../../lib/quiz-options");
const security_1 = require("../../lib/security");
const csrf_1 = require("../../middleware/csrf");
const validate_1 = require("../../middleware/validate");
const helpers_1 = require("./helpers");
const listUsersQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).optional(),
    role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
    regionId: zod_1.z.string().optional(),
    cityId: zod_1.z.string().optional(),
    districtId: zod_1.z.string().optional(),
    schoolId: zod_1.z.string().optional(),
    gradeNumber: zod_1.z.coerce.number().int().min(1).max(11).optional(),
    gradeLetter: zod_1.z.string().trim().max(5).optional(),
});
const createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(80),
    firstName: zod_1.z.string().trim().min(2).max(80).optional(),
    lastName: zod_1.z.string().trim().min(2).max(80).optional(),
    middleName: zod_1.z.string().trim().min(2).max(80).optional(),
    email: zod_1.z.string().email().toLowerCase(),
    password: zod_1.z.string().min(8).max(128),
    role: zod_1.z.nativeEnum(client_1.UserRole).default(client_1.UserRole.USER),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).default(client_1.EntityStatus.ACTIVE),
    regionId: zod_1.z.string().trim().nullable().optional(),
    cityId: zod_1.z.string().trim().nullable().optional(),
    districtId: zod_1.z.string().trim().nullable().optional(),
    customDistrictName: zod_1.z.string().trim().min(2).max(180).nullable().optional(),
    schoolId: zod_1.z.string().trim().nullable().optional(),
    customSchoolName: zod_1.z.string().trim().min(2).max(180).nullable().optional(),
    gradeNumber: zod_1.z.number().int().min(1).max(11).optional(),
    gradeLetter: zod_1.z.string().trim().min(1).max(5).optional(),
});
const updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(80).optional(),
    firstName: zod_1.z.string().trim().min(2).max(80).optional(),
    lastName: zod_1.z.string().trim().min(2).max(80).optional(),
    middleName: zod_1.z.string().trim().min(2).max(80).optional(),
    email: zod_1.z.string().email().toLowerCase().optional(),
    role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).optional(),
    password: zod_1.z.string().min(8).max(128).optional(),
    regionId: zod_1.z.string().trim().nullable().optional(),
    cityId: zod_1.z.string().trim().nullable().optional(),
    districtId: zod_1.z.string().trim().nullable().optional(),
    customDistrictName: zod_1.z.string().trim().min(2).max(180).nullable().optional(),
    schoolId: zod_1.z.string().trim().nullable().optional(),
    customSchoolName: zod_1.z.string().trim().min(2).max(180).nullable().optional(),
    gradeNumber: zod_1.z.number().int().min(1).max(11).optional(),
    gradeLetter: zod_1.z.string().trim().min(1).max(5).optional(),
});
const insightsQuerySchema = zod_1.z.object({
    search: zod_1.z.string().trim().min(1).max(120).optional(),
});
function ensureMutableUser(targetRole) {
    if (targetRole === client_1.UserRole.SUPER_ADMIN) {
        throw new errors_1.AppError("Main admin cannot be changed or archived", 403);
    }
}
function ensureRoleValueAllowed(nextRole) {
    if (nextRole === client_1.UserRole.SUPER_ADMIN) {
        throw new errors_1.AppError("SUPER_ADMIN role cannot be assigned via admin panel", 403);
    }
}
function ensureRoleChangePermission(actorRole) {
    if (actorRole !== client_1.UserRole.SUPER_ADMIN) {
        throw new errors_1.AppError("Only SUPER_ADMIN can manage roles", 403);
    }
}
const adminUserSelect = {
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
function composeUserName(parts) {
    const merged = [parts.lastName, parts.firstName, parts.middleName]
        .filter((item) => Boolean(item && item.trim()))
        .map((item) => item.trim());
    return merged.join(" ").trim();
}
function validatePasswordStrength(password) {
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (!hasLetter || !hasNumber) {
        throw new errors_1.AppError("Password must contain at least one letter and one number", 422);
    }
}
exports.adminUsersRouter = (0, express_1.Router)();
exports.adminUsersRouter.get("/insights", (0, validate_1.validateQuery)(insightsQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const users = await prisma_1.prisma.user.findMany({
        where: query.search
            ? {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" } },
                    { firstName: { contains: query.search, mode: "insensitive" } },
                    { lastName: { contains: query.search, mode: "insensitive" } },
                    { middleName: { contains: query.search, mode: "insensitive" } },
                    { email: { contains: query.search, mode: "insensitive" } },
                    { customDistrictName: { contains: query.search, mode: "insensitive" } },
                    { customSchoolName: { contains: query.search, mode: "insensitive" } },
                ],
            }
            : undefined,
        orderBy: { createdAt: "desc" },
        select: adminUserSelect,
    });
    if (users.length === 0) {
        res.json({ users: [], actions: [] });
        return;
    }
    const userIds = users.map((user) => user.id);
    const [attempts, sessions, favoriteMaterials, favoriteDirections] = await Promise.all([
        prisma_1.prisma.quizAttempt.findMany({
            where: { userId: { in: userIds } },
            orderBy: { submittedAt: "asc" },
            include: {
                direction: {
                    select: { id: true, name: true },
                },
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        }),
        prisma_1.prisma.refreshToken.findMany({
            where: { userId: { in: userIds } },
            orderBy: { createdAt: "asc" },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        }),
        prisma_1.prisma.favoriteMaterial.findMany({
            where: { userId: { in: userIds } },
            orderBy: { createdAt: "asc" },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                material: {
                    select: { id: true, title: true },
                },
            },
        }),
        prisma_1.prisma.favoriteDirection.findMany({
            where: { userId: { in: userIds } },
            orderBy: { createdAt: "asc" },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
                direction: {
                    select: { id: true, name: true },
                },
            },
        }),
    ]);
    const userStats = new Map();
    const ensureStats = (userId) => {
        const existing = userStats.get(userId);
        if (existing)
            return existing;
        const created = {
            attemptsCount: 0,
            sessionsCount: 0,
            favoriteMaterialsCount: 0,
            favoriteDirectionsCount: 0,
            lastAttemptAt: null,
            lastLoginAt: null,
            lastActiveAt: null,
            totalPercentage: 0,
            bestPercentage: 0,
            successAttempts: 0,
        };
        userStats.set(userId, created);
        return created;
    };
    for (const attempt of attempts) {
        const stats = ensureStats(attempt.userId);
        stats.attemptsCount += 1;
        if (!stats.lastAttemptAt || attempt.submittedAt > stats.lastAttemptAt) {
            stats.lastAttemptAt = attempt.submittedAt;
        }
        if (!stats.lastActiveAt || attempt.submittedAt > stats.lastActiveAt) {
            stats.lastActiveAt = attempt.submittedAt;
        }
        stats.totalPercentage += attempt.percentage;
        stats.bestPercentage = Math.max(stats.bestPercentage, attempt.percentage);
        if (attempt.percentage >= 70) {
            stats.successAttempts += 1;
        }
    }
    for (const session of sessions) {
        const stats = ensureStats(session.userId);
        stats.sessionsCount += 1;
        if (!stats.lastLoginAt || session.createdAt > stats.lastLoginAt) {
            stats.lastLoginAt = session.createdAt;
        }
        if (!stats.lastActiveAt || session.createdAt > stats.lastActiveAt) {
            stats.lastActiveAt = session.createdAt;
        }
    }
    for (const favorite of favoriteMaterials) {
        const stats = ensureStats(favorite.userId);
        stats.favoriteMaterialsCount += 1;
        if (!stats.lastActiveAt || favorite.createdAt > stats.lastActiveAt) {
            stats.lastActiveAt = favorite.createdAt;
        }
    }
    for (const favorite of favoriteDirections) {
        const stats = ensureStats(favorite.userId);
        stats.favoriteDirectionsCount += 1;
        if (!stats.lastActiveAt || favorite.createdAt > stats.lastActiveAt) {
            stats.lastActiveAt = favorite.createdAt;
        }
    }
    const enrichedUsers = users.map((user) => {
        const stats = userStats.get(user.id) || {
            attemptsCount: 0,
            sessionsCount: 0,
            favoriteMaterialsCount: 0,
            favoriteDirectionsCount: 0,
            lastAttemptAt: null,
            lastLoginAt: null,
            lastActiveAt: null,
            totalPercentage: 0,
            bestPercentage: 0,
            successAttempts: 0,
        };
        return {
            ...user,
            stats: {
                attemptsCount: stats.attemptsCount,
                sessionsCount: stats.sessionsCount,
                favoriteMaterialsCount: stats.favoriteMaterialsCount,
                favoriteDirectionsCount: stats.favoriteDirectionsCount,
                lastAttemptAt: stats.lastAttemptAt,
                lastLoginAt: stats.lastLoginAt,
                lastActiveAt: stats.lastActiveAt,
                bestPercentage: stats.bestPercentage,
                successAttempts: stats.successAttempts,
                averagePercentage: stats.attemptsCount > 0
                    ? Number((stats.totalPercentage / stats.attemptsCount).toFixed(2))
                    : 0,
            },
        };
    });
    const actions = [
        ...sessions.map((session) => ({
            id: `login:${session.id}`,
            type: "LOGIN",
            at: session.createdAt,
            user: session.user,
            meta: {
                ip: session.ip,
                userAgent: session.userAgent,
            },
        })),
        ...attempts.map((attempt) => ({
            id: `attempt:${attempt.id}`,
            type: "QUIZ_SUBMIT",
            at: attempt.submittedAt,
            user: attempt.user,
            meta: {
                attemptId: attempt.id,
                directionId: attempt.directionId,
                directionName: attempt.direction.name,
                score: attempt.score,
                total: attempt.total,
                percentage: attempt.percentage,
            },
        })),
        ...favoriteMaterials.map((favorite) => ({
            id: `favorite_material:${favorite.userId}:${favorite.materialId}:${favorite.createdAt.getTime()}`,
            type: "FAVORITE_MATERIAL_ADD",
            at: favorite.createdAt,
            user: favorite.user,
            meta: {
                materialId: favorite.materialId,
                materialTitle: favorite.material.title,
            },
        })),
        ...favoriteDirections.map((favorite) => ({
            id: `favorite_direction:${favorite.userId}:${favorite.directionId}:${favorite.createdAt.getTime()}`,
            type: "FAVORITE_DIRECTION_ADD",
            at: favorite.createdAt,
            user: favorite.user,
            meta: {
                directionId: favorite.directionId,
                directionName: favorite.direction.name,
            },
        })),
    ];
    res.json({
        users: enrichedUsers,
        actions,
    });
}));
exports.adminUsersRouter.get("/profiles/:id", (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.params.id;
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: adminUserSelect,
    });
    if (!user)
        throw new errors_1.AppError("User not found", 404);
    const [attempts, sessions, favoriteMaterials, favoriteDirections] = await Promise.all([
        prisma_1.prisma.quizAttempt.findMany({
            where: { userId },
            orderBy: { submittedAt: "asc" },
            include: {
                direction: {
                    select: { id: true, name: true },
                },
                answers: {
                    orderBy: {
                        question: {
                            orderIndex: "asc",
                        },
                    },
                    include: {
                        question: {
                            select: {
                                id: true,
                                questionText: true,
                                optionsJson: true,
                                correctAnswerIndex: true,
                                orderIndex: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma_1.prisma.refreshToken.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                createdAt: true,
                expiresAt: true,
                revokedAt: true,
                ip: true,
                userAgent: true,
            },
        }),
        prisma_1.prisma.favoriteMaterial.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            include: {
                material: {
                    select: { id: true, title: true },
                },
            },
        }),
        prisma_1.prisma.favoriteDirection.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            include: {
                direction: {
                    select: { id: true, name: true },
                },
            },
        }),
    ]);
    const directionMap = new Map();
    for (const attempt of attempts) {
        const existing = directionMap.get(attempt.directionId);
        if (!existing) {
            directionMap.set(attempt.directionId, {
                directionId: attempt.directionId,
                directionName: attempt.direction.name,
                attemptsCount: 1,
                bestPercentage: attempt.percentage,
                averagePercentage: attempt.percentage,
                lastSubmittedAt: attempt.submittedAt,
            });
            continue;
        }
        existing.attemptsCount += 1;
        existing.bestPercentage = Math.max(existing.bestPercentage, attempt.percentage);
        existing.averagePercentage =
            (existing.averagePercentage * (existing.attemptsCount - 1) + attempt.percentage) /
                existing.attemptsCount;
        if (!existing.lastSubmittedAt || attempt.submittedAt > existing.lastSubmittedAt) {
            existing.lastSubmittedAt = attempt.submittedAt;
        }
    }
    const mappedAttempts = attempts.map((attempt) => ({
        id: attempt.id,
        directionId: attempt.directionId,
        directionName: attempt.direction.name,
        score: attempt.score,
        total: attempt.total,
        percentage: attempt.percentage,
        submittedAt: attempt.submittedAt,
        answers: attempt.answers.map((answer) => {
            const options = (0, quiz_options_1.parseQuizOptionsJson)(answer.question.optionsJson);
            return {
                id: answer.id,
                questionId: answer.questionId,
                questionText: answer.question.questionText,
                orderIndex: answer.question.orderIndex,
                selectedAnswerIndex: answer.selectedAnswerIndex,
                selectedAnswerText: (0, quiz_options_1.optionLabel)(options[answer.selectedAnswerIndex], answer.selectedAnswerIndex),
                correctAnswerIndex: answer.question.correctAnswerIndex,
                correctAnswerText: (0, quiz_options_1.optionLabel)(options[answer.question.correctAnswerIndex], answer.question.correctAnswerIndex),
                isCorrect: answer.isCorrect,
            };
        }),
    }));
    const actions = [
        ...sessions.map((session) => ({
            id: `login:${session.id}`,
            type: "LOGIN",
            at: session.createdAt,
            meta: {
                ip: session.ip,
                userAgent: session.userAgent,
                revokedAt: session.revokedAt,
            },
        })),
        ...attempts.map((attempt) => ({
            id: `attempt:${attempt.id}`,
            type: "QUIZ_SUBMIT",
            at: attempt.submittedAt,
            meta: {
                attemptId: attempt.id,
                directionId: attempt.directionId,
                directionName: attempt.direction.name,
                percentage: attempt.percentage,
            },
        })),
        ...favoriteMaterials.map((favorite) => ({
            id: `favorite_material:${favorite.materialId}:${favorite.createdAt.getTime()}`,
            type: "FAVORITE_MATERIAL_ADD",
            at: favorite.createdAt,
            meta: {
                materialId: favorite.materialId,
                materialTitle: favorite.material.title,
            },
        })),
        ...favoriteDirections.map((favorite) => ({
            id: `favorite_direction:${favorite.directionId}:${favorite.createdAt.getTime()}`,
            type: "FAVORITE_DIRECTION_ADD",
            at: favorite.createdAt,
            meta: {
                directionId: favorite.directionId,
                directionName: favorite.direction.name,
            },
        })),
    ];
    res.json({
        user,
        directions: Array.from(directionMap.values())
            .map((row) => ({
            ...row,
            averagePercentage: Number(row.averagePercentage.toFixed(2)),
        }))
            .sort((a, b) => b.attemptsCount - a.attemptsCount),
        attempts: mappedAttempts,
        sessions,
        favorites: {
            materials: favoriteMaterials.map((favorite) => ({
                id: favorite.material.id,
                title: favorite.material.title,
                addedAt: favorite.createdAt,
            })),
            directions: favoriteDirections.map((favorite) => ({
                id: favorite.direction.id,
                name: favorite.direction.name,
                addedAt: favorite.createdAt,
            })),
        },
        actions,
    });
}));
exports.adminUsersRouter.get("/", (0, validate_1.validateQuery)(listUsersQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const users = await prisma_1.prisma.user.findMany({
        where: {
            ...(query.role ? { role: query.role } : {}),
            ...(query.status ? { status: query.status } : {}),
            ...(query.regionId ? { regionId: query.regionId } : {}),
            ...(query.cityId ? { cityId: query.cityId } : {}),
            ...(query.districtId ? { districtId: query.districtId } : {}),
            ...(query.schoolId ? { schoolId: query.schoolId } : {}),
            ...(query.gradeNumber ? { gradeNumber: query.gradeNumber } : {}),
            ...(query.gradeLetter ? { gradeLetter: query.gradeLetter.toUpperCase() } : {}),
            ...(query.search
                ? {
                    OR: [
                        { name: { contains: query.search, mode: "insensitive" } },
                        { firstName: { contains: query.search, mode: "insensitive" } },
                        { lastName: { contains: query.search, mode: "insensitive" } },
                        { middleName: { contains: query.search, mode: "insensitive" } },
                        { email: { contains: query.search, mode: "insensitive" } },
                        { customDistrictName: { contains: query.search, mode: "insensitive" } },
                        { customSchoolName: { contains: query.search, mode: "insensitive" } },
                        { region: { name: { contains: query.search, mode: "insensitive" } } },
                        { city: { name: { contains: query.search, mode: "insensitive" } } },
                        { district: { name: { contains: query.search, mode: "insensitive" } } },
                        { school: { name: { contains: query.search, mode: "insensitive" } } },
                    ],
                }
                : {}),
        },
        orderBy: { createdAt: "desc" },
        select: adminUserSelect,
    });
    res.json({ users: users });
}));
exports.adminUsersRouter.get("/:id", (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.params.id },
        select: adminUserSelect,
    });
    if (!user)
        throw new errors_1.AppError("User not found", 404);
    res.json({ user });
}));
exports.adminUsersRouter.post("/", csrf_1.requireCsrf, (0, validate_1.validateBody)(createUserSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    ensureRoleValueAllowed(body.role);
    if (body.role !== client_1.UserRole.USER) {
        ensureRoleChangePermission(req.user.role);
    }
    validatePasswordStrength(body.password);
    const passwordHash = await (0, security_1.hashPassword)(body.password);
    const [region, city, district, school] = await Promise.all([
        body.regionId
            ? prisma_1.prisma.region.findUnique({
                where: { id: body.regionId },
                select: { id: true },
            })
            : Promise.resolve(null),
        body.cityId
            ? prisma_1.prisma.city.findUnique({
                where: { id: body.cityId },
                select: { id: true, regionId: true },
            })
            : Promise.resolve(null),
        body.districtId
            ? prisma_1.prisma.district.findUnique({
                where: { id: body.districtId },
                select: { id: true, regionId: true, cityId: true },
            })
            : Promise.resolve(null),
        body.schoolId
            ? prisma_1.prisma.school.findUnique({
                where: { id: body.schoolId },
                select: { id: true, districtId: true },
            })
            : Promise.resolve(null),
    ]);
    if (body.regionId && !region)
        throw new errors_1.AppError("Region not found", 400);
    if (body.cityId && !city)
        throw new errors_1.AppError("City not found", 400);
    if (body.districtId && !district)
        throw new errors_1.AppError("District not found", 400);
    if (body.schoolId && !school)
        throw new errors_1.AppError("School not found", 400);
    if (city && body.regionId && city.regionId !== body.regionId) {
        throw new errors_1.AppError("City does not belong to selected region", 400);
    }
    if (district && body.regionId && district.regionId !== body.regionId) {
        throw new errors_1.AppError("District does not belong to selected region", 400);
    }
    if (district && body.cityId && district.cityId && district.cityId !== body.cityId) {
        throw new errors_1.AppError("District does not belong to selected city", 400);
    }
    if (body.customDistrictName && body.schoolId) {
        throw new errors_1.AppError("School cannot be assigned with custom district", 400);
    }
    let districtId = body.districtId || null;
    let customDistrictName = districtId ? null : body.customDistrictName || null;
    if (school) {
        if (districtId && school.districtId !== districtId) {
            throw new errors_1.AppError("School does not belong to selected district", 400);
        }
        if (!districtId) {
            districtId = school.districtId;
            customDistrictName = null;
        }
    }
    const computedName = composeUserName({
        firstName: body.firstName,
        lastName: body.lastName,
        middleName: body.middleName,
    }) || body.name;
    const user = await prisma_1.prisma.user.create({
        data: {
            name: computedName,
            firstName: body.firstName || null,
            lastName: body.lastName || null,
            middleName: body.middleName || null,
            email: body.email,
            passwordHash,
            role: body.role,
            status: body.status,
            regionId: body.regionId || null,
            cityId: body.cityId || null,
            districtId,
            customDistrictName,
            schoolId: body.schoolId || null,
            customSchoolName: body.schoolId ? null : body.customSchoolName || null,
            gradeNumber: body.gradeNumber ?? null,
            gradeLetter: body.gradeLetter ? body.gradeLetter.toUpperCase() : null,
            archivedAt: body.status === client_1.EntityStatus.ARCHIVED ? new Date() : null,
        },
        select: adminUserSelect,
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "user",
        entityId: user.id,
        action: "create",
        beforeJson: null,
        afterJson: user,
        req,
    });
    res.status(201).json({ user });
}));
exports.adminUsersRouter.patch("/:id", csrf_1.requireCsrf, (0, validate_1.validateBody)(updateUserSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const userId = req.params.id;
    const before = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
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
        },
    });
    if (!before)
        throw new errors_1.AppError("User not found", 404);
    ensureMutableUser(before.role);
    if (body.role) {
        ensureRoleValueAllowed(body.role);
        ensureRoleChangePermission(req.user.role);
    }
    const nextRegionId = body.regionId !== undefined ? body.regionId : before.regionId;
    const nextCityId = body.cityId !== undefined ? body.cityId : before.cityId;
    let nextDistrictId = body.districtId !== undefined ? body.districtId : before.districtId;
    const nextSchoolId = body.schoolId !== undefined ? body.schoolId : before.schoolId;
    let nextCustomDistrictName = body.customDistrictName !== undefined ? body.customDistrictName : before.customDistrictName;
    const [region, city, district, school] = await Promise.all([
        nextRegionId
            ? prisma_1.prisma.region.findUnique({
                where: { id: nextRegionId },
                select: { id: true },
            })
            : Promise.resolve(null),
        nextCityId
            ? prisma_1.prisma.city.findUnique({
                where: { id: nextCityId },
                select: { id: true, regionId: true },
            })
            : Promise.resolve(null),
        nextDistrictId
            ? prisma_1.prisma.district.findUnique({
                where: { id: nextDistrictId },
                select: { id: true, regionId: true, cityId: true },
            })
            : Promise.resolve(null),
        nextSchoolId
            ? prisma_1.prisma.school.findUnique({
                where: { id: nextSchoolId },
                select: { id: true, districtId: true },
            })
            : Promise.resolve(null),
    ]);
    if (nextRegionId && !region)
        throw new errors_1.AppError("Region not found", 400);
    if (nextCityId && !city)
        throw new errors_1.AppError("City not found", 400);
    if (nextDistrictId && !district)
        throw new errors_1.AppError("District not found", 400);
    if (nextSchoolId && !school)
        throw new errors_1.AppError("School not found", 400);
    if (city && nextRegionId && city.regionId !== nextRegionId) {
        throw new errors_1.AppError("City does not belong to selected region", 400);
    }
    if (district && nextRegionId && district.regionId !== nextRegionId) {
        throw new errors_1.AppError("District does not belong to selected region", 400);
    }
    if (district && nextCityId && district.cityId && district.cityId !== nextCityId) {
        throw new errors_1.AppError("District does not belong to selected city", 400);
    }
    if (nextCustomDistrictName && nextSchoolId) {
        throw new errors_1.AppError("School cannot be assigned with custom district", 400);
    }
    if (school) {
        if (nextDistrictId && school.districtId !== nextDistrictId) {
            throw new errors_1.AppError("School does not belong to selected district", 400);
        }
        if (!nextDistrictId) {
            nextDistrictId = school.districtId;
            nextCustomDistrictName = null;
        }
    }
    if (nextDistrictId) {
        nextCustomDistrictName = null;
    }
    const nextFirstName = body.firstName !== undefined ? body.firstName : before.firstName;
    const nextLastName = body.lastName !== undefined ? body.lastName : before.lastName;
    const nextMiddleName = body.middleName !== undefined ? body.middleName : before.middleName;
    const derivedName = composeUserName({
        firstName: nextFirstName,
        lastName: nextLastName,
        middleName: nextMiddleName,
    }) ||
        before.name;
    const nextName = body.name || derivedName;
    let nextPasswordHash;
    if (body.password) {
        validatePasswordStrength(body.password);
        nextPasswordHash = await (0, security_1.hashPassword)(body.password);
    }
    const data = {
        ...(nextName ? { name: nextName } : {}),
        ...(body.firstName !== undefined ? { firstName: body.firstName || null } : {}),
        ...(body.lastName !== undefined ? { lastName: body.lastName || null } : {}),
        ...(body.middleName !== undefined ? { middleName: body.middleName || null } : {}),
        ...(body.email ? { email: body.email } : {}),
        ...(body.role ? { role: body.role } : {}),
        ...(body.status ? (0, helpers_1.statusUpdateData)(body.status) : {}),
        ...(body.regionId !== undefined ? { regionId: body.regionId || null } : {}),
        ...(body.cityId !== undefined ? { cityId: body.cityId || null } : {}),
        ...(body.districtId !== undefined || body.schoolId !== undefined
            ? { districtId: nextDistrictId || null }
            : {}),
        ...(body.customDistrictName !== undefined || body.districtId !== undefined || body.schoolId !== undefined
            ? { customDistrictName: nextCustomDistrictName || null }
            : {}),
        ...(body.schoolId !== undefined ? { schoolId: body.schoolId || null } : {}),
        ...(body.customSchoolName !== undefined || body.schoolId !== undefined
            ? { customSchoolName: nextSchoolId ? null : body.customSchoolName || null }
            : {}),
        ...(body.gradeNumber !== undefined ? { gradeNumber: body.gradeNumber ?? null } : {}),
        ...(body.gradeLetter !== undefined
            ? { gradeLetter: body.gradeLetter ? body.gradeLetter.toUpperCase() : null }
            : {}),
        ...(nextPasswordHash ? { passwordHash: nextPasswordHash } : {}),
    };
    const user = await prisma_1.prisma.user.update({
        where: { id: userId },
        data,
        select: adminUserSelect,
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "user",
        entityId: user.id,
        action: "update",
        beforeJson: before,
        afterJson: user,
        req,
    });
    res.json({ user });
}));
exports.adminUsersRouter.post("/:id/archive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const userId = req.params.id;
    const before = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, status: true, role: true, email: true, name: true },
    });
    if (!before)
        throw new errors_1.AppError("User not found", 404);
    ensureMutableUser(before.role);
    const user = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ARCHIVED),
        select: { id: true, status: true, role: true, email: true, name: true },
    });
    await prisma_1.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "user",
        entityId: user.id,
        action: "archive",
        beforeJson: before,
        afterJson: user,
        req,
    });
    res.json({ user });
}));
exports.adminUsersRouter.post("/:id/unarchive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const userId = req.params.id;
    const before = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, status: true, role: true, email: true, name: true },
    });
    if (!before)
        throw new errors_1.AppError("User not found", 404);
    ensureMutableUser(before.role);
    const user = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ACTIVE),
        select: { id: true, status: true, role: true, email: true, name: true },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "user",
        entityId: user.id,
        action: "unarchive",
        beforeJson: before,
        afterJson: user,
        req,
    });
    res.json({ user });
}));
exports.adminUsersRouter.delete("/:id", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const userId = req.params.id;
    if (req.user.id === userId) {
        throw new errors_1.AppError("You cannot delete your own account", 403);
    }
    const before = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!before)
        throw new errors_1.AppError("User not found", 404);
    ensureMutableUser(before.role);
    try {
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.adminAuditLog.deleteMany({
                where: { adminId: userId },
            });
            await tx.user.delete({
                where: { id: userId },
            });
        });
    }
    catch (error) {
        if ((0, helpers_1.isRelationConstraintError)(error)) {
            throw new errors_1.AppError("User cannot be deleted because related records exist", 409);
        }
        throw error;
    }
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "user",
        entityId: userId,
        action: "delete",
        beforeJson: before,
        afterJson: null,
        req,
    });
    res.json({ deleted: true, id: userId });
}));
//# sourceMappingURL=users.router.js.map