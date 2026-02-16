import { describe, expect, it } from "vitest";

import { computeQuizResult } from "./score";

describe("computeQuizResult", () => {
  it("computes score and percentage", () => {
    const result = computeQuizResult(
      [
        { id: "q1", correctAnswerIndex: 1 },
        { id: "q2", correctAnswerIndex: 0 },
        { id: "q3", correctAnswerIndex: 2 },
      ],
      [
        { questionId: "q1", selectedAnswerIndex: 1 },
        { questionId: "q2", selectedAnswerIndex: 1 },
        { questionId: "q3", selectedAnswerIndex: 2 },
      ],
    );

    expect(result.score).toBe(2);
    expect(result.total).toBe(3);
    expect(result.percentage).toBe(67);
  });

  it("throws on duplicate answers", () => {
    expect(() =>
      computeQuizResult(
        [
          { id: "q1", correctAnswerIndex: 1 },
          { id: "q2", correctAnswerIndex: 0 },
        ],
        [
          { questionId: "q1", selectedAnswerIndex: 1 },
          { questionId: "q1", selectedAnswerIndex: 1 },
        ],
      ),
    ).toThrowError("Duplicate question answers are not allowed");
  });
});
