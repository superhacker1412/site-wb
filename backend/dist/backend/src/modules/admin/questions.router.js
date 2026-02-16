"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminQuestionsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma_1 = require("../../lib/prisma");
const async_handler_1 = require("../../lib/async-handler");
const errors_1 = require("../../lib/errors");
const html_sanitizer_1 = require("../../lib/html-sanitizer");
const quiz_options_1 = require("../../lib/quiz-options");
const csrf_1 = require("../../middleware/csrf");
const validate_1 = require("../../middleware/validate");
const helpers_1 = require("./helpers");
const imagePathSchema = zod_1.z
    .string()
    .trim()
    .max(1000)
    .refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), {
    message: "imagePath must be a relative path or absolute http(s) URL",
});
const questionOptionSchema = zod_1.z.object({
    type: zod_1.z.enum(["TEXT", "IMAGE"]),
    text: zod_1.z.string().trim().max(300).optional(),
    imagePath: imagePathSchema.optional(),
});
const createQuestionSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    directionId: zod_1.z.string().trim().min(1),
    type: zod_1.z.nativeEnum(client_1.QuestionType),
    questionText: zod_1.z.string().trim().min(3),
    options: zod_1.z.array(questionOptionSchema).optional(),
    imagePath: imagePathSchema.nullable().optional(),
    correctAnswerIndex: zod_1.z.number().int().min(0),
    explanationHtml: zod_1.z.string().min(1),
    orderIndex: zod_1.z.number().int().min(1).optional(),
    status: zod_1.z.nativeEnum(client_1.EntityStatus).default(client_1.EntityStatus.ACTIVE),
});
const updateQuestionSchema = createQuestionSchema.partial();
function normalizeQuestionOptions(type, options) {
    if (type === client_1.QuestionType.TRUE_FALSE) {
        return [
            { type: "TEXT", text: "Ha" },
            { type: "TEXT", text: "Yo'q" },
        ];
    }
    const normalized = (options || []).map((option) => {
        if (type === client_1.QuestionType.CHOICE) {
            if (option.type !== "TEXT") {
                throw new errors_1.AppError("CHOICE question accepts only TEXT options", 422);
            }
            const text = option.text?.trim();
            if (!text) {
                throw new errors_1.AppError("Each TEXT option must have text", 422);
            }
            return {
                type: "TEXT",
                text,
            };
        }
        if (option.type !== "IMAGE") {
            throw new errors_1.AppError("IMAGE question accepts only IMAGE options", 422);
        }
        const imagePath = option.imagePath?.trim();
        if (!imagePath) {
            throw new errors_1.AppError("Each IMAGE option must have imagePath", 422);
        }
        return {
            type: "IMAGE",
            imagePath,
            ...(option.text?.trim() ? { text: option.text.trim() } : {}),
        };
    });
    return normalized;
}
function ensureValidCorrectAnswerIndex(correctAnswerIndex, options) {
    if (options.length === 0) {
        throw new errors_1.AppError("Question options are required", 422);
    }
    if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
        throw new errors_1.AppError("correctAnswerIndex is out of options range", 422);
    }
}
exports.adminQuestionsRouter = (0, express_1.Router)();
exports.adminQuestionsRouter.get("/", (0, async_handler_1.asyncHandler)(async (req, res) => {
    const directionId = typeof req.query.directionId === "string" ? req.query.directionId : undefined;
    const questions = await prisma_1.prisma.quizQuestion.findMany({
        where: directionId ? { directionId } : undefined,
        orderBy: [{ directionId: "asc" }, { orderIndex: "asc" }],
        include: {
            direction: {
                select: { id: true, name: true },
            },
        },
    });
    res.json({
        questions: questions.map((question) => ({
            ...question,
            options: (0, quiz_options_1.parseQuizOptionsJson)(question.optionsJson),
        })),
    });
}));
exports.adminQuestionsRouter.post("/", csrf_1.requireCsrf, (0, validate_1.validateBody)(createQuestionSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const body = req.body;
    const direction = await prisma_1.prisma.quizDirection.findUnique({
        where: { id: body.directionId },
        select: { id: true },
    });
    if (!direction)
        throw new errors_1.AppError("Direction not found", 404);
    const existingMax = await prisma_1.prisma.quizQuestion.aggregate({
        where: { directionId: body.directionId },
        _max: { orderIndex: true },
    });
    const orderIndex = body.orderIndex || (existingMax._max.orderIndex || 0) + 1;
    const options = normalizeQuestionOptions(body.type, body.options);
    if ((body.type === client_1.QuestionType.CHOICE || body.type === client_1.QuestionType.IMAGE) && options.length < 2) {
        throw new errors_1.AppError("At least 2 options are required", 422);
    }
    ensureValidCorrectAnswerIndex(body.correctAnswerIndex, options);
    const questionText = (0, html_sanitizer_1.sanitizePlainText)(body.questionText);
    if (questionText.length < 3) {
        throw new errors_1.AppError("questionText is empty after sanitization", 422);
    }
    const explanationHtml = (0, html_sanitizer_1.sanitizeRichHtml)(body.explanationHtml);
    if (!(0, html_sanitizer_1.hasMeaningfulHtmlContent)(explanationHtml)) {
        throw new errors_1.AppError("explanationHtml is empty after sanitization", 422);
    }
    const question = await prisma_1.prisma.quizQuestion.create({
        data: {
            id: body.id,
            directionId: body.directionId,
            type: body.type,
            questionText,
            optionsJson: options,
            imagePath: body.imagePath || null,
            correctAnswerIndex: body.correctAnswerIndex,
            explanationHtml,
            orderIndex,
            ...(0, helpers_1.statusUpdateData)(body.status),
        },
        include: {
            direction: { select: { id: true, name: true } },
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "quiz_question",
        entityId: question.id,
        action: "create",
        beforeJson: null,
        afterJson: question,
        req,
    });
    res.status(201).json({
        question: {
            ...question,
            options: (0, quiz_options_1.parseQuizOptionsJson)(question.optionsJson),
        },
    });
}));
exports.adminQuestionsRouter.patch("/:id", csrf_1.requireCsrf, (0, validate_1.validateBody)(updateQuestionSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const body = req.body;
    const before = await prisma_1.prisma.quizQuestion.findUnique({ where: { id } });
    if (!before)
        throw new errors_1.AppError("Question not found", 404);
    if (body.directionId) {
        const direction = await prisma_1.prisma.quizDirection.findUnique({
            where: { id: body.directionId },
            select: { id: true },
        });
        if (!direction)
            throw new errors_1.AppError("Direction not found", 404);
    }
    const finalType = body.type || before.type;
    const normalizedOptions = body.options ? normalizeQuestionOptions(finalType, body.options) : undefined;
    const currentOptions = (0, quiz_options_1.parseQuizOptionsJson)(before.optionsJson);
    const finalOptions = normalizedOptions ?? currentOptions;
    if ((finalType === client_1.QuestionType.CHOICE || finalType === client_1.QuestionType.IMAGE) && finalOptions.length < 2) {
        throw new errors_1.AppError("At least 2 options are required", 422);
    }
    const finalCorrectAnswerIndex = body.correctAnswerIndex !== undefined ? body.correctAnswerIndex : before.correctAnswerIndex;
    ensureValidCorrectAnswerIndex(finalCorrectAnswerIndex, finalOptions);
    const questionText = body.questionText ? (0, html_sanitizer_1.sanitizePlainText)(body.questionText) : null;
    if (questionText !== null && questionText.length < 3) {
        throw new errors_1.AppError("questionText is empty after sanitization", 422);
    }
    const explanationHtml = body.explanationHtml ? (0, html_sanitizer_1.sanitizeRichHtml)(body.explanationHtml) : null;
    if (explanationHtml !== null && !(0, html_sanitizer_1.hasMeaningfulHtmlContent)(explanationHtml)) {
        throw new errors_1.AppError("explanationHtml is empty after sanitization", 422);
    }
    const question = await prisma_1.prisma.quizQuestion.update({
        where: { id },
        data: {
            ...(body.directionId ? { directionId: body.directionId } : {}),
            ...(body.type ? { type: body.type } : {}),
            ...(questionText !== null ? { questionText } : {}),
            ...(normalizedOptions ? { optionsJson: normalizedOptions } : {}),
            ...(body.imagePath !== undefined ? { imagePath: body.imagePath } : {}),
            ...(body.correctAnswerIndex !== undefined ? { correctAnswerIndex: body.correctAnswerIndex } : {}),
            ...(explanationHtml !== null ? { explanationHtml } : {}),
            ...(body.orderIndex ? { orderIndex: body.orderIndex } : {}),
            ...(body.status ? (0, helpers_1.statusUpdateData)(body.status) : {}),
        },
        include: {
            direction: { select: { id: true, name: true } },
        },
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "quiz_question",
        entityId: question.id,
        action: "update",
        beforeJson: before,
        afterJson: question,
        req,
    });
    res.json({
        question: {
            ...question,
            options: (0, quiz_options_1.parseQuizOptionsJson)(question.optionsJson),
        },
    });
}));
exports.adminQuestionsRouter.post("/:id/archive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.quizQuestion.findUnique({ where: { id } });
    if (!before)
        throw new errors_1.AppError("Question not found", 404);
    const question = await prisma_1.prisma.quizQuestion.update({
        where: { id },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ARCHIVED),
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "quiz_question",
        entityId: id,
        action: "archive",
        beforeJson: before,
        afterJson: question,
        req,
    });
    res.json({ question });
}));
exports.adminQuestionsRouter.post("/:id/unarchive", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.quizQuestion.findUnique({ where: { id } });
    if (!before)
        throw new errors_1.AppError("Question not found", 404);
    const question = await prisma_1.prisma.quizQuestion.update({
        where: { id },
        data: (0, helpers_1.statusUpdateData)(client_1.EntityStatus.ACTIVE),
    });
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "quiz_question",
        entityId: id,
        action: "unarchive",
        beforeJson: before,
        afterJson: question,
        req,
    });
    res.json({ question });
}));
exports.adminQuestionsRouter.delete("/:id", csrf_1.requireCsrf, (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma_1.prisma.quizQuestion.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    answers: true,
                },
            },
        },
    });
    if (!before)
        throw new errors_1.AppError("Question not found", 404);
    let removedAnswersCount = 0;
    try {
        await prisma_1.prisma.$transaction(async (tx) => {
            if (before._count.answers > 0) {
                const deletedAnswers = await tx.quizAnswer.deleteMany({
                    where: { questionId: id },
                });
                removedAnswersCount = deletedAnswers.count;
            }
            await tx.quizQuestion.delete({
                where: { id },
            });
        });
    }
    catch (error) {
        if ((0, helpers_1.isRelationConstraintError)(error)) {
            throw new errors_1.AppError("Question cannot be deleted because related records exist", 409);
        }
        throw error;
    }
    await (0, helpers_1.adminAudit)({
        adminId: req.user.id,
        entityType: "quiz_question",
        entityId: id,
        action: "delete",
        beforeJson: before,
        afterJson: { removedAnswersCount },
        req,
    });
    res.json({ deleted: true, id });
}));
//# sourceMappingURL=questions.router.js.map