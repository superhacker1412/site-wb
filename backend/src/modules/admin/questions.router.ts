import { Router } from "express";
import { EntityStatus, QuestionType } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../lib/async-handler";
import { AppError } from "../../lib/errors";
import { hasMeaningfulHtmlContent, sanitizePlainText, sanitizeRichHtml } from "../../lib/html-sanitizer";
import { parseQuizOptionsJson, QuizOption } from "../../lib/quiz-options";
import { requireCsrf } from "../../middleware/csrf";
import { validateBody } from "../../middleware/validate";
import { adminAudit, isRelationConstraintError, statusUpdateData } from "./helpers";

const imagePathSchema = z
  .string()
  .trim()
  .max(1000)
  .refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), {
    message: "imagePath must be a relative path or absolute http(s) URL",
  });

const questionOptionSchema = z.object({
  type: z.enum(["TEXT", "IMAGE"]),
  text: z.string().trim().max(300).optional(),
  imagePath: imagePathSchema.optional(),
});

const createQuestionSchema = z.object({
  id: z.string().optional(),
  directionId: z.string().trim().min(1),
  type: z.nativeEnum(QuestionType),
  questionText: z.string().trim().min(3),
  options: z.array(questionOptionSchema).optional(),
  imagePath: imagePathSchema.nullable().optional(),
  correctAnswerIndex: z.number().int().min(0),
  explanationHtml: z.string().min(1),
  orderIndex: z.number().int().min(1).optional(),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.ACTIVE),
});

const updateQuestionSchema = createQuestionSchema.partial();

type QuestionOptionInput = z.infer<typeof questionOptionSchema>;

function normalizeQuestionOptions(type: QuestionType, options?: QuestionOptionInput[]): QuizOption[] {
  if (type === QuestionType.TRUE_FALSE) {
    return [
      { type: "TEXT", text: "Ha" },
      { type: "TEXT", text: "Yo'q" },
    ];
  }

  const normalized = (options || []).map((option) => {
    if (type === QuestionType.CHOICE) {
      if (option.type !== "TEXT") {
        throw new AppError("CHOICE question accepts only TEXT options", 422);
      }
      const text = option.text?.trim();
      if (!text) {
        throw new AppError("Each TEXT option must have text", 422);
      }
      return {
        type: "TEXT" as const,
        text,
      };
    }

    if (option.type !== "IMAGE") {
      throw new AppError("IMAGE question accepts only IMAGE options", 422);
    }
    const imagePath = option.imagePath?.trim();
    if (!imagePath) {
      throw new AppError("Each IMAGE option must have imagePath", 422);
    }
    return {
      type: "IMAGE" as const,
      imagePath,
      ...(option.text?.trim() ? { text: option.text.trim() } : {}),
    };
  });

  return normalized;
}

function ensureValidCorrectAnswerIndex(correctAnswerIndex: number, options: QuizOption[]): void {
  if (options.length === 0) {
    throw new AppError("Question options are required", 422);
  }
  if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
    throw new AppError("correctAnswerIndex is out of options range", 422);
  }
}

export const adminQuestionsRouter = Router();

adminQuestionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const directionId = typeof req.query.directionId === "string" ? req.query.directionId : undefined;
    const questions = await prisma.quizQuestion.findMany({
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
        options: parseQuizOptionsJson(question.optionsJson),
      })),
    });
  }),
);

adminQuestionsRouter.post(
  "/",
  requireCsrf,
  validateBody(createQuestionSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const body = req.body as z.infer<typeof createQuestionSchema>;

    const direction = await prisma.quizDirection.findUnique({
      where: { id: body.directionId },
      select: { id: true },
    });
    if (!direction) throw new AppError("Direction not found", 404);

    const existingMax = await prisma.quizQuestion.aggregate({
      where: { directionId: body.directionId },
      _max: { orderIndex: true },
    });
    const orderIndex = body.orderIndex || (existingMax._max.orderIndex || 0) + 1;

    const options = normalizeQuestionOptions(body.type, body.options);
    if ((body.type === QuestionType.CHOICE || body.type === QuestionType.IMAGE) && options.length < 2) {
      throw new AppError("At least 2 options are required", 422);
    }
    ensureValidCorrectAnswerIndex(body.correctAnswerIndex, options);
    const questionText = sanitizePlainText(body.questionText);
    if (questionText.length < 3) {
      throw new AppError("questionText is empty after sanitization", 422);
    }
    const explanationHtml = sanitizeRichHtml(body.explanationHtml);
    if (!hasMeaningfulHtmlContent(explanationHtml)) {
      throw new AppError("explanationHtml is empty after sanitization", 422);
    }

    const question = await prisma.quizQuestion.create({
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
        ...statusUpdateData(body.status),
      },
      include: {
        direction: { select: { id: true, name: true } },
      },
    });

    await adminAudit({
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
        options: parseQuizOptionsJson(question.optionsJson),
      },
    });
  }),
);

adminQuestionsRouter.patch(
  "/:id",
  requireCsrf,
  validateBody(updateQuestionSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;
    const body = req.body as z.infer<typeof updateQuestionSchema>;

    const before = await prisma.quizQuestion.findUnique({ where: { id } });
    if (!before) throw new AppError("Question not found", 404);
    if (body.directionId) {
      const direction = await prisma.quizDirection.findUnique({
        where: { id: body.directionId },
        select: { id: true },
      });
      if (!direction) throw new AppError("Direction not found", 404);
    }

    const finalType = body.type || before.type;
    const normalizedOptions = body.options ? normalizeQuestionOptions(finalType, body.options) : undefined;
    const currentOptions = parseQuizOptionsJson(before.optionsJson);
    const finalOptions = normalizedOptions ?? currentOptions;
    if ((finalType === QuestionType.CHOICE || finalType === QuestionType.IMAGE) && finalOptions.length < 2) {
      throw new AppError("At least 2 options are required", 422);
    }
    const finalCorrectAnswerIndex =
      body.correctAnswerIndex !== undefined ? body.correctAnswerIndex : before.correctAnswerIndex;
    ensureValidCorrectAnswerIndex(finalCorrectAnswerIndex, finalOptions);
    const questionText = body.questionText ? sanitizePlainText(body.questionText) : null;
    if (questionText !== null && questionText.length < 3) {
      throw new AppError("questionText is empty after sanitization", 422);
    }
    const explanationHtml = body.explanationHtml ? sanitizeRichHtml(body.explanationHtml) : null;
    if (explanationHtml !== null && !hasMeaningfulHtmlContent(explanationHtml)) {
      throw new AppError("explanationHtml is empty after sanitization", 422);
    }

    const question = await prisma.quizQuestion.update({
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
        ...(body.status ? statusUpdateData(body.status) : {}),
      },
      include: {
        direction: { select: { id: true, name: true } },
      },
    });

    await adminAudit({
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
        options: parseQuizOptionsJson(question.optionsJson),
      },
    });
  }),
);

adminQuestionsRouter.post(
  "/:id/archive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma.quizQuestion.findUnique({ where: { id } });
    if (!before) throw new AppError("Question not found", 404);
    const question = await prisma.quizQuestion.update({
      where: { id },
      data: statusUpdateData(EntityStatus.ARCHIVED),
    });
    await adminAudit({
      adminId: req.user.id,
      entityType: "quiz_question",
      entityId: id,
      action: "archive",
      beforeJson: before,
      afterJson: question,
      req,
    });
    res.json({ question });
  }),
);

adminQuestionsRouter.post(
  "/:id/unarchive",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;
    const before = await prisma.quizQuestion.findUnique({ where: { id } });
    if (!before) throw new AppError("Question not found", 404);
    const question = await prisma.quizQuestion.update({
      where: { id },
      data: statusUpdateData(EntityStatus.ACTIVE),
    });
    await adminAudit({
      adminId: req.user.id,
      entityType: "quiz_question",
      entityId: id,
      action: "unarchive",
      beforeJson: before,
      afterJson: question,
      req,
    });
    res.json({ question });
  }),
);

adminQuestionsRouter.delete(
  "/:id",
  requireCsrf,
  asyncHandler(async (req, res) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const id = req.params.id;

    const before = await prisma.quizQuestion.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            answers: true,
          },
        },
      },
    });
    if (!before) throw new AppError("Question not found", 404);

    let removedAnswersCount = 0;
    try {
      await prisma.$transaction(async (tx) => {
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
    } catch (error) {
      if (isRelationConstraintError(error)) {
        throw new AppError(
          "Question cannot be deleted because related records exist",
          409,
        );
      }
      throw error;
    }

    await adminAudit({
      adminId: req.user.id,
      entityType: "quiz_question",
      entityId: id,
      action: "delete",
      beforeJson: before,
      afterJson: { removedAnswersCount },
      req,
    });

    res.json({ deleted: true, id });
  }),
);
