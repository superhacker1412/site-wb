"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const prisma_1 = require("../../lib/prisma");
const errors_1 = require("../../lib/errors");
const async_handler_1 = require("../../lib/async-handler");
const quiz_options_1 = require("../../lib/quiz-options");
const auth_1 = require("../../middleware/auth");
const csrf_1 = require("../../middleware/csrf");
const validate_1 = require("../../middleware/validate");
const score_1 = require("./score");
const directionQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.EntityStatus).optional(),
});
const submitSchema = zod_1.z.object({
    directionId: zod_1.z.string().min(1),
    answers: zod_1.z
        .array(zod_1.z.object({
        questionId: zod_1.z.string().min(1),
        selectedAnswerIndex: zod_1.z.number().int().min(0),
    }))
        .min(1),
});
exports.quizRouter = (0, express_1.Router)();
exports.quizRouter.get("/directions", (0, validate_1.validateQuery)(directionQuerySchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    const query = req.query;
    const directions = await prisma_1.prisma.quizDirection.findMany({
        where: query.status ? { status: query.status } : undefined,
        orderBy: { name: "asc" },
        include: {
            _count: {
                select: {
                    questions: true,
                },
            },
        },
    });
    res.json({
        directions: directions.map((direction) => ({
            ...direction,
            questionCount: direction._count.questions,
        })),
    });
}));
exports.quizRouter.get("/directions/:id/questions", auth_1.authenticate, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const directionId = req.params.id;
    const direction = await prisma_1.prisma.quizDirection.findUnique({
        where: { id: directionId },
        select: { id: true },
    });
    if (!direction)
        throw new errors_1.AppError("Direction not found", 404);
    const questions = await prisma_1.prisma.quizQuestion.findMany({
        where: { directionId },
        orderBy: { orderIndex: "asc" },
        select: {
            id: true,
            type: true,
            questionText: true,
            optionsJson: true,
            imagePath: true,
            explanationHtml: true,
            orderIndex: true,
            status: true,
        },
    });
    res.json({
        questions: questions.map((question) => ({
            ...question,
            options: (0, quiz_options_1.parseQuizOptionsJson)(question.optionsJson),
        })),
    });
}));
exports.quizRouter.post("/attempts/submit", auth_1.authenticate, csrf_1.requireCsrf, (0, validate_1.validateBody)(submitSchema), (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.AppError("Unauthorized", 401);
    const { directionId, answers } = req.body;
    const direction = await prisma_1.prisma.quizDirection.findUnique({
        where: { id: directionId },
        select: { id: true, name: true, status: true },
    });
    if (!direction)
        throw new errors_1.AppError("Direction not found", 404);
    const questions = await prisma_1.prisma.quizQuestion.findMany({
        where: { directionId },
        orderBy: { orderIndex: "asc" },
        select: {
            id: true,
            correctAnswerIndex: true,
            explanationHtml: true,
            questionText: true,
        },
    });
    if (questions.length === 0)
        throw new errors_1.AppError("No questions in selected direction", 400);
    let result;
    try {
        result = (0, score_1.computeQuizResult)(questions, answers);
    }
    catch (error) {
        throw new errors_1.AppError(error instanceof Error ? error.message : "Invalid answers payload", 422);
    }
    const { score, total, percentage, answerRows } = result;
    const attempt = await prisma_1.prisma.$transaction(async (tx) => {
        const createdAttempt = await tx.quizAttempt.create({
            data: {
                userId: req.user.id,
                directionId,
                score,
                total,
                percentage,
            },
        });
        await tx.quizAnswer.createMany({
            data: answerRows.map((answer) => ({
                attemptId: createdAttempt.id,
                questionId: answer.questionId,
                selectedAnswerIndex: answer.selectedAnswerIndex,
                isCorrect: answer.isCorrect,
            })),
        });
        return createdAttempt;
    });
    res.status(201).json({
        attempt: {
            id: attempt.id,
            directionId,
            directionName: direction.name,
            score,
            total,
            percentage,
            submittedAt: attempt.submittedAt,
        },
        details: answerRows,
    });
}));
//# sourceMappingURL=quiz.router.js.map