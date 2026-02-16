export type ScoreQuestion = {
  id: string;
  correctAnswerIndex: number;
  explanationHtml?: string;
  questionText?: string;
};

export type SubmittedAnswer = {
  questionId: string;
  selectedAnswerIndex: number;
};

export function computeQuizResult(questions: ScoreQuestion[], answers: SubmittedAnswer[]) {
  if (questions.length === 0) {
    throw new Error("No questions provided");
  }

  if (answers.length !== questions.length) {
    throw new Error("All questions must be answered");
  }

  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const uniqueSubmitted = new Set(answers.map((answer) => answer.questionId));

  if (uniqueSubmitted.size !== answers.length) {
    throw new Error("Duplicate question answers are not allowed");
  }

  let score = 0;

  const answerRows = answers.map((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) throw new Error(`Unknown question id: ${answer.questionId}`);
    const isCorrect = question.correctAnswerIndex === answer.selectedAnswerIndex;
    if (isCorrect) score += 1;
    return {
      questionId: answer.questionId,
      selectedAnswerIndex: answer.selectedAnswerIndex,
      correctAnswerIndex: question.correctAnswerIndex,
      isCorrect,
      explanationHtml: question.explanationHtml || "",
      questionText: question.questionText || "",
    };
  });

  const total = questions.length;
  const percentage = Math.round((score / total) * 100);

  return {
    score,
    total,
    percentage,
    answerRows,
  };
}
