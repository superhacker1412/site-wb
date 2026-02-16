import { Router } from "express";
import { z } from "zod";
import { EntityStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { AppError } from "../../lib/errors";
import { asyncHandler } from "../../lib/async-handler";
import { parseQuizOptionsJson } from "../../lib/quiz-options";
import { authenticate } from "../../middleware/auth";
import { requireCsrf } from "../../middleware/csrf";
import { validateBody, validateQuery } from "../../middleware/validate";
import { computeQuizResult } from "./score";

const directionQuerySchema = z.object({
  status: z.nativeEnum(EntityStatus).optional(),
});

const submitSchema = z.object({
  directionId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedAnswerIndex: z.number().int().min(0),
      }),
    )
    .min(1),
});

export const quizRouter = Router();

quizRouter.get(
  "/directions",
  validateQuery(directionQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as z.infer<typeof directionQuerySchema>;
    const directions = await prisma.quizDirection.findMany({
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
  }),
);

quizRouter.get(
  "/directions/:id/questions",
  authenticate,
  asyncHandler(async (req, res) => {
    const directionId = req.params.id;

    const direction = await prisma.quizDirection.findUnique({
      where: { id: directionId },
      select: { id: true },
    });
    if (!direction) throw new AppError("Direction not found", 404);

    const questions = await prisma.quizQuestion.findMany({
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
        options: parseQuizOptionsJson(question.optionsJson),
      })),
    });
  }),
);

quizRouter.post(
  "/attempts/submit",
  authenticate,
  requireCsrf,
  validateBody(submitSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    const { directionId, answers } = req.body as z.infer<typeof submitSchema>;
    const direction = await prisma.quizDirection.findUnique({
      where: { id: directionId },
      select: { id: true, name: true, status: true },
    });

    if (!direction) throw new AppError("Direction not found", 404);

    const questions = await prisma.quizQuestion.findMany({
      where: { directionId },
      orderBy: { orderIndex: "asc" },
      select: {
        id: true,
        correctAnswerIndex: true,
        explanationHtml: true,
        questionText: true,
      },
    });

    if (questions.length === 0) throw new AppError("No questions in selected direction", 400);

    let result;
    try {
      result = computeQuizResult(questions, answers);
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Invalid answers payload",
        422,
      );
    }

    const { score, total, percentage, answerRows } = result;

    const attempt = await prisma.$transaction(async (tx) => {
      const createdAttempt = await tx.quizAttempt.create({
        data: {
          userId: req.user!.id,
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
  }),
);
