import { useMemo, useState } from "react";
import { Star, Trophy, ArrowRight } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, toAssetUrl } from "@/lib/api";
import { QuizDirection, QuizQuestion, QuizSubmitDetail } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

type Phase = "select" | "quiz" | "result";

export default function Quiz() {
  const { favoriteTests, toggleFavoriteTest, refreshTestHistory } = useAuth();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("select");
  const [selectedDir, setSelectedDir] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; percentage: number; directionName: string } | null>(null);
  const [details, setDetails] = useState<QuizSubmitDetail[]>([]);

  const directionsQuery = useQuery({
    queryKey: ["quiz", "directions"],
    queryFn: () => apiFetch<{ directions: QuizDirection[] }>("/quiz/directions"),
  });

  const questionsQuery = useQuery({
    queryKey: ["quiz", "questions", selectedDir],
    queryFn: () => apiFetch<{ questions: QuizQuestion[] }>(`/quiz/directions/${selectedDir}/questions`),
    enabled: phase === "quiz" && Boolean(selectedDir),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { directionId: string; answers: Array<{ questionId: string; selectedAnswerIndex: number }> }) =>
      apiFetch<{
        attempt: { score: number; total: number; percentage: number; directionName: string };
        details: QuizSubmitDetail[];
      }>("/quiz/attempts/submit", {
        method: "POST",
        body: payload,
      }),
  });

  const directions = directionsQuery.data?.directions || [];
  const questions = questionsQuery.data?.questions || [];
  const currentQuestion = questions[currentQ];

  const selectedDirection = useMemo(
    () => directions.find((direction) => direction.id === selectedDir),
    [directions, selectedDir],
  );

  const startDirection = (directionId: string) => {
    setSelectedDir(directionId);
    setCurrentQ(0);
    setAnswers({});
    setDetails([]);
    setResult(null);
    setPhase("quiz");
  };

  const handleNext = async () => {
    if (!currentQuestion) return;
    const answered = answers[currentQuestion.id] !== undefined;
    if (!answered) {
      toast({ title: "Javob tanlang", variant: "destructive" });
      return;
    }

    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
      return;
    }

    try {
      const payload = {
        directionId: selectedDir,
        answers: Object.entries(answers).map(([questionId, selectedAnswerIndex]) => ({
          questionId,
          selectedAnswerIndex,
        })),
      };
      const response = await submitMutation.mutateAsync(payload);
      setResult(response.attempt);
      setDetails(response.details);
      setPhase("result");
      await refreshTestHistory();
    } catch (error) {
      toast({
        title: "Testni yuborishda xatolik",
        description: error instanceof Error ? error.message : "Xatolik",
        variant: "destructive",
      });
    }
  };

  if (phase === "select") {
    return (
      <div className="container py-8">
        <h1 className="mb-2 text-3xl font-bold">O'zingni sinab ko'r</h1>
        <p className="mb-8 text-muted-foreground">Yo'nalishni tanlang va bilimingizni tekshiring</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {directions.map((direction) => (
            <Card
              key={direction.id}
              className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              onClick={() => startDirection(direction.id)}
            >
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 text-5xl">{direction.icon}</div>
                <h3 className="mb-2 text-xl font-semibold">{direction.name}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{direction.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{direction.questionCount || 0} ta savol</span>
                  <button
                    onClick={async (event) => {
                      event.stopPropagation();
                      try {
                        await toggleFavoriteTest(direction.id);
                      } catch (error) {
                        toast({
                          title: "Saqlashda xatolik",
                          description: error instanceof Error ? error.message : "Xatolik",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="text-muted-foreground hover:text-yellow-500"
                  >
                    <Star className={`h-4 w-4 ${favoriteTests.includes(direction.id) ? "fill-yellow-400 text-yellow-400" : ""}`} />
                  </button>
                </div>
                {direction.status === "ARCHIVED" && <Badge variant="secondary" className="mt-3">Arxiv</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "quiz" && currentQuestion) {
    const selectedAnswer = answers[currentQuestion.id];
    const isLast = currentQ === questions.length - 1;

    return (
      <div className="container max-w-2xl py-8">
        <div className="mb-6 flex items-center justify-between text-sm">
          <span className="font-medium">{selectedDirection?.name}</span>
          <span className="text-muted-foreground">{currentQ + 1} / {questions.length}</span>
        </div>
        <div className="mb-8 h-2 w-full rounded-full bg-muted">
          <div className="h-2 rounded-full bg-accent transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
        </div>

        <Card>
          <CardContent className="p-6 md:p-8 space-y-6">
            <h2 className="text-lg font-semibold whitespace-pre-line">{currentQuestion.questionText}</h2>
            {currentQuestion.imagePath && (
              <div className="flex justify-center">
                <img
                  src={toAssetUrl(currentQuestion.imagePath)}
                  alt="Savol rasmi"
                  className="max-h-[360px] w-auto max-w-full rounded-lg border object-contain"
                  loading="lazy"
                />
              </div>
            )}
            <RadioGroup
              key={currentQuestion.id}
              value={selectedAnswer !== undefined ? selectedAnswer.toString() : ""}
              onValueChange={(value) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: Number(value) }))}
            >
              <div className="space-y-3">
                {(currentQuestion.options || []).map((option, index) => (
                  <label key={index} className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:border-accent">
                    <RadioGroupItem value={index.toString()} id={`opt-${currentQuestion.id}-${index}`} />
                    <Label htmlFor={`opt-${currentQuestion.id}-${index}`} className="flex-1 cursor-pointer text-base">
                      {option.type === "IMAGE" && option.imagePath ? (
                        <span className="flex items-center gap-3">
                          <img
                            src={toAssetUrl(option.imagePath)}
                            alt={option.text || `Variant ${index + 1}`}
                            className="h-16 w-16 rounded-md border object-cover"
                            loading="lazy"
                          />
                          <span>{option.text || `Rasm variant ${index + 1}`}</span>
                        </span>
                      ) : (
                        option.text || `Variant ${index + 1}`
                      )}
                    </Label>
                  </label>
                ))}
              </div>
            </RadioGroup>
            <div className="text-right">
              <Button onClick={handleNext} className="gap-2" disabled={submitMutation.isPending}>
                {isLast ? "Yakunlash" : "Keyingi savol"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="container flex items-center justify-center py-20">
        <Card className="w-full max-w-xl">
          <CardContent className="p-8 text-center">
            <Trophy className={`mx-auto mb-4 h-16 w-16 ${result.percentage >= 70 ? "text-yellow-500" : result.percentage >= 40 ? "text-accent" : "text-muted-foreground"}`} />
            <h2 className="mb-2 text-3xl font-bold">{result.percentage}%</h2>
            <p className="mb-1 text-lg font-medium">{result.directionName}</p>
            <p className="mb-6 text-muted-foreground">{result.score} / {result.total} ta to'g'ri javob</p>
            <div className="space-y-2 text-left">
              {details.map((detail) => (
                <div key={detail.questionId} className="rounded-md border p-3">
                  <p className="font-medium text-sm">{detail.questionText}</p>
                  <p className={`text-sm ${detail.isCorrect ? "text-emerald-600" : "text-rose-600"}`}>
                    {detail.isCorrect ? "To'g'ri" : "Noto'g'ri"}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Button onClick={() => setPhase("select")}>Boshqa test</Button>
              <Button variant="outline" onClick={() => startDirection(selectedDir)}>Qayta urinish</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
