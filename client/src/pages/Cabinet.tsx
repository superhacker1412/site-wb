import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import {
  BookOpen,
  ChartColumnBig,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Star,
  User,
  UserCircle2,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, toAssetUrl } from "@/lib/api";
import { roleLabel, statusLabel } from "@/lib/labels";
import { Material, QuizDirection } from "@/types/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CabinetTab = "overview" | "profile" | "history" | "materials" | "tests" | "security";
type HistoryFilter = "ALL" | "PASSED" | "FAILED";

type HistoryItem = {
  id: string;
  direction: string;
  directionName: string;
  score: number;
  total: number;
  percentage: number;
  submittedAt: string;
};

function resolveCabinetTab(raw: string | null): CabinetTab {
  if (raw === "profile") return "profile";
  if (raw === "history") return "history";
  if (raw === "materials") return "materials";
  if (raw === "tests") return "tests";
  if (raw === "security") return "security";
  if (raw === "dashboard") return "overview";
  if (raw === "overview") return "overview";
  return "overview";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function scoreColor(percentage: number): string {
  if (percentage >= 85) return "text-emerald-600";
  if (percentage >= 70) return "text-blue-600";
  if (percentage >= 50) return "text-amber-600";
  return "text-rose-600";
}

export default function Cabinet() {
  const { user, logout, refreshSessionData } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const tab = resolveCabinetTab(searchParams.get("tab"));

  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("ALL");
  const [materialsSearch, setMaterialsSearch] = useState("");
  const [testsSearch, setTestsSearch] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const historyQuery = useQuery({
    queryKey: ["me", "history"],
    queryFn: () => apiFetch<{ history: HistoryItem[] }>("/me/history"),
    enabled: Boolean(user),
  });

  const favoriteMaterialsQuery = useQuery({
    queryKey: ["me", "favorites", "materials"],
    queryFn: () => apiFetch<{ items: Material[] }>("/me/favorites/materials"),
    enabled: Boolean(user),
  });

  const favoriteDirectionsQuery = useQuery({
    queryKey: ["me", "favorites", "directions"],
    queryFn: () => apiFetch<{ items: QuizDirection[] }>("/me/favorites/directions"),
    enabled: Boolean(user),
  });

  const removeFavoriteMaterialMutation = useMutation({
    mutationFn: (materialId: string) => apiFetch(`/me/favorites/materials/${materialId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["me", "favorites", "materials"] }),
        refreshSessionData(),
      ]);
      toast({ title: "Material sevimlilardan olib tashlandi" });
    },
    onError: (error) => {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Amal bajarilmadi",
        variant: "destructive",
      });
    },
  });

  const removeFavoriteDirectionMutation = useMutation({
    mutationFn: (directionId: string) => apiFetch(`/me/favorites/directions/${directionId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["me", "favorites", "directions"] }),
        refreshSessionData(),
      ]);
      toast({ title: "Test sevimlilardan olib tashlandi" });
    },
    onError: (error) => {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Amal bajarilmadi",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      apiFetch("/auth/change-password", { method: "POST", body: payload }),
    onSuccess: async () => {
      toast({ title: "Parol yangilandi. Qayta kirishingiz kerak." });
      await refreshSessionData();
      navigate("/kirish");
    },
    onError: (error) => {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Parolni yangilab bo'lmadi",
        variant: "destructive",
      });
    },
  });

  const logoutAllMutation = useMutation({
    mutationFn: () => apiFetch("/auth/logout-all", { method: "POST" }),
    onSuccess: async () => {
      toast({ title: "Barcha sessiyalar yopildi" });
      await refreshSessionData();
      navigate("/kirish");
    },
    onError: (error) => {
      toast({
        title: "Xatolik",
        description: error instanceof Error ? error.message : "Sessiyalarni yopib bo'lmadi",
        variant: "destructive",
      });
    },
  });

  const history = historyQuery.data?.history || [];
  const favoriteMaterials = favoriteMaterialsQuery.data?.items || [];
  const favoriteDirections = favoriteDirectionsQuery.data?.items || [];

  const stats = useMemo(() => {
    if (history.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        successRate: 0,
        lastAttemptAt: null as string | null,
      };
    }
    const totalAttempts = history.length;
    const totalScore = history.reduce((sum, item) => sum + item.percentage, 0);
    const bestScore = history.reduce((max, item) => Math.max(max, item.percentage), 0);
    const successCount = history.filter((item) => item.percentage >= 70).length;
    return {
      totalAttempts,
      averageScore: Number((totalScore / totalAttempts).toFixed(2)),
      bestScore,
      successRate: Number(((successCount / totalAttempts) * 100).toFixed(2)),
      lastAttemptAt: history[0]?.submittedAt || null,
    };
  }, [history]);

  const attemptsByDay = useMemo(() => {
    const map = new Map<string, { attempts: number; totalPercentage: number }>();
    for (const item of history) {
      const day = new Date(item.submittedAt).toISOString().slice(0, 10);
      const prev = map.get(day) || { attempts: 0, totalPercentage: 0 };
      prev.attempts += 1;
      prev.totalPercentage += item.percentage;
      map.set(day, prev);
    }

    const rows = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, value]) => ({
        day,
        attempts: value.attempts,
        avgScore: Number((value.totalPercentage / value.attempts).toFixed(2)),
      }));
    return rows;
  }, [history]);

  const attemptsByDirection = useMemo(() => {
    const map = new Map<string, { count: number; totalPercentage: number }>();
    for (const item of history) {
      const prev = map.get(item.directionName) || { count: 0, totalPercentage: 0 };
      prev.count += 1;
      prev.totalPercentage += item.percentage;
      map.set(item.directionName, prev);
    }
    return Array.from(map.entries())
      .map(([directionName, value]) => ({
        directionName,
        attempts: value.count,
        avgScore: Number((value.totalPercentage / value.count).toFixed(2)),
      }))
      .sort((a, b) => b.attempts - a.attempts);
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const bySearch = !historySearch.trim() || item.directionName.toLowerCase().includes(historySearch.trim().toLowerCase());
      const byStatus =
        historyFilter === "ALL" ||
        (historyFilter === "PASSED" && item.percentage >= 70) ||
        (historyFilter === "FAILED" && item.percentage < 70);
      return bySearch && byStatus;
    });
  }, [history, historyFilter, historySearch]);

  const filteredMaterials = useMemo(() => {
    if (!materialsSearch.trim()) return favoriteMaterials;
    return favoriteMaterials.filter((item) => {
      const value = `${item.title} ${item.description} ${item.category?.name || ""}`.toLowerCase();
      return value.includes(materialsSearch.trim().toLowerCase());
    });
  }, [favoriteMaterials, materialsSearch]);

  const filteredDirections = useMemo(() => {
    if (!testsSearch.trim()) return favoriteDirections;
    return favoriteDirections.filter((item) => {
      const value = `${item.name} ${item.description}`.toLowerCase();
      return value.includes(testsSearch.trim().toLowerCase());
    });
  }, [favoriteDirections, testsSearch]);

  const tabs: Array<{ id: CabinetTab; label: string; icon: typeof LayoutDashboard; badge?: number }> = [
    { id: "overview", label: "Umumiy", icon: LayoutDashboard },
    { id: "profile", label: "Profil", icon: UserCircle2 },
    { id: "history", label: "Test tarixi", icon: History, badge: stats.totalAttempts },
    { id: "materials", label: "Sevimli materiallar", icon: BookOpen, badge: favoriteMaterials.length },
    { id: "tests", label: "Sevimli testlar", icon: FileText, badge: favoriteDirections.length },
    { id: "security", label: "Xavfsizlik", icon: ShieldCheck },
  ];

  const selectTab = (next: CabinetTab) => {
    if (next === "overview") {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ tab: next }, { replace: true });
  };

  if (!user) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-bold">Kirish kerak</h2>
            <p className="mb-6 text-muted-foreground">Kabinetga kirish uchun tizimga kiring.</p>
            <Link to="/kirish">
              <Button className="w-full">Tizimga kirish</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-5 rounded-2xl border bg-gradient-to-r from-indigo-900 via-slate-900 to-cyan-800 p-5 text-white" data-aos="fade-up">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Shaxsiy kabinet</h1>
            <p className="text-sm text-white/80">Profil, natijalar, sevimlilar va xavfsizlik sozlamalari bitta joyda.</p>
          </div>
          <div className="rounded-lg bg-white/10 px-3 py-2 text-sm">
            <span className="font-semibold">{user.name}</span>
            <span className="mx-2">|</span>
            <span>{user.email}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <Card data-aos="fade-right">
            <CardHeader>
              <CardTitle className="text-base">Kabinet menyusi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3">
              {tabs.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {item.badge !== undefined ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs",
                          active ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card data-aos="fade-right" data-aos-delay="80">
            <CardHeader>
              <CardTitle className="text-base">Tezkor statistika</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-muted-foreground">Urinishlar</span>
                <span className="font-semibold">{stats.totalAttempts}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-muted-foreground">O'rtacha ball</span>
                <span className="font-semibold">{stats.averageScore}%</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-muted-foreground">Eng yaxshi ball</span>
                <span className="font-semibold">{stats.bestScore}%</span>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </Button>
        </aside>

        <section className="space-y-4">
          {tab === "overview" ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Urinishlar</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-bold">{stats.totalAttempts}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">O'rtacha ball</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-bold">{stats.averageScore}%</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Eng yaxshi ball</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-bold">{stats.bestScore}%</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Muvaffaqiyat foizi</CardTitle>
                  </CardHeader>
                  <CardContent className="text-3xl font-bold">{stats.successRate}%</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Oxirgi urinish</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm font-semibold">{formatDate(stats.lastAttemptAt)}</CardContent>
                </Card>
              </div>

              {history.length > 0 ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ChartColumnBig className="h-5 w-5" />
                        Kunlar bo'yicha urinishlar
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ReactECharts
                        option={{
                          tooltip: { trigger: "axis" },
                          xAxis: {
                            type: "category",
                            data: attemptsByDay.map((row) => new Date(row.day).toLocaleDateString()),
                          },
                          yAxis: { type: "value" },
                          series: [{ type: "line", smooth: true, data: attemptsByDay.map((row) => row.attempts) }],
                        }}
                        style={{ height: 290 }}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Yo'nalish bo'yicha o'rtacha natija
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ReactECharts
                        option={{
                          tooltip: { trigger: "axis" },
                          xAxis: {
                            type: "category",
                            axisLabel: { rotate: 20 },
                            data: attemptsByDirection.map((row) => row.directionName),
                          },
                          yAxis: { type: "value", max: 100 },
                          series: [{ type: "bar", data: attemptsByDirection.map((row) => row.avgScore) }],
                        }}
                        style={{ height: 290 }}
                      />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">Hali test topshirilmagan.</CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>So'nggi urinishlar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {history.slice(0, 6).map((item) => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">{item.directionName}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(item.submittedAt)}</p>
                        </div>
                        <div className={cn("text-xl font-bold", scoreColor(item.percentage))}>{item.percentage}%</div>
                      </div>
                      <Progress value={item.percentage} className="mt-2 h-2" />
                    </div>
                  ))}
                  {history.length === 0 ? <p className="text-sm text-muted-foreground">Urinishlar mavjud emas.</p> : null}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {tab === "profile" ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-5">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
                      {user.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{user.name}</h2>
                      <p className="text-muted-foreground">{user.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{roleLabel(user.role)}</Badge>
                        <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>{statusLabel(user.status)}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Natijalar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Jami urinishlar</span><span>{stats.totalAttempts}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">O'rtacha ball</span><span>{stats.averageScore}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Eng yaxshi ball</span><span>{stats.bestScore}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Muvaffaqiyat</span><span>{stats.successRate}%</span></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Profil ma'lumotlari</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Viloyat</span><span>{user.region?.name || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Shahar</span><span>{user.city?.name || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tuman</span><span>{user.district?.name || user.customDistrictName || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Maktab</span><span>{user.school?.name || user.customSchoolName || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Klass</span><span>{user.gradeNumber ? `${user.gradeNumber}${user.gradeLetter || ""}` : "-"}</span></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}

          {tab === "history" ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Filterlar</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 md:grid-cols-[1fr_220px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Yo'nalish nomi bo'yicha qidiring..."
                      value={historySearch}
                      onChange={(event) => setHistorySearch(event.target.value)}
                    />
                  </div>
                  <Select value={historyFilter} onValueChange={(value) => setHistoryFilter(value as HistoryFilter)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Barchasi</SelectItem>
                      <SelectItem value="PASSED">Faqat muvaffaqiyatli</SelectItem>
                      <SelectItem value="FAILED">Faqat past natija</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test tarixi ({filteredHistory.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">{item.directionName}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(item.submittedAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-2xl font-bold", scoreColor(item.percentage))}>{item.percentage}%</p>
                          <p className="text-xs text-muted-foreground">{item.score}/{item.total} to'g'ri</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    </div>
                  ))}
                  {filteredHistory.length === 0 ? <p className="text-sm text-muted-foreground">Mos natijalar topilmadi.</p> : null}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {tab === "materials" ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sevimli materiallar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Nomi yoki tavsif bo'yicha qidiring..."
                      value={materialsSearch}
                      onChange={(event) => setMaterialsSearch(event.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredMaterials.map((material) => (
                  <Card key={material.id} className="overflow-hidden">
                    {material.imagePath ? (
                      <img src={toAssetUrl(material.imagePath)} alt={material.title} className="aspect-video w-full object-cover" />
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-muted text-sm text-muted-foreground">Rasm yo'q</div>
                    )}
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{material.title}</h3>
                        {material.status === "ARCHIVED" ? <Badge variant="secondary">Arxiv</Badge> : null}
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{material.description}</p>
                      <div className="text-xs text-muted-foreground">{material.category?.name || "Kategoriya ko'rsatilmagan"}</div>
                      <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" asChild>
  <Link to={`/test/${direction.id}`}>O&apos;tish</Link>
</Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => removeFavoriteMaterialMutation.mutate(material.id)}
                          disabled={removeFavoriteMaterialMutation.isPending}
                        >
                          Olib tashlash
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredMaterials.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="p-8 text-center text-muted-foreground">Sevimli materiallar topilmadi.</CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          ) : null}

          {tab === "tests" ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sevimli testlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Test nomi bo'yicha qidiring..."
                      value={testsSearch}
                      onChange={(event) => setTestsSearch(event.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredDirections.map((direction) => (
                  <Card key={direction.id}>
                    <CardContent className="space-y-2 p-5">
                      <div className="text-3xl">{direction.icon}</div>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-semibold">{direction.name}</h3>
                        {direction.status === "ARCHIVED" ? <Badge variant="secondary">Arxiv</Badge> : null}
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{direction.description}</p>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/test">O'tish</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => removeFavoriteDirectionMutation.mutate(direction.id)}
                          disabled={removeFavoriteDirectionMutation.isPending}
                        >
                          Olib tashlash
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredDirections.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="p-8 text-center text-muted-foreground">Sevimli testlar topilmadi.</CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          ) : null}

          {tab === "security" ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Parolni yangilash</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Joriy parol</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Yangi parol</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="confirmPassword">Yangi parolni tasdiqlang</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2 flex gap-2">
                    <Button
                      onClick={() => {
                        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                          toast({
                            title: "Xatolik",
                            description: "Yangi parollar mos emas",
                            variant: "destructive",
                          });
                          return;
                        }
                        changePasswordMutation.mutate({
                          currentPassword: passwordForm.currentPassword,
                          newPassword: passwordForm.newPassword,
                        });
                      }}
                      disabled={changePasswordMutation.isPending}
                    >
                      {changePasswordMutation.isPending ? "Yangilanmoqda..." : "Parolni yangilash"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPasswordForm({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        })
                      }
                    >
                      Tozalash
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sessiyalar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Agar akkaunt ochiq qolgan bo'lsa, barcha sessiyalarni bir vaqtda yopishingiz mumkin.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => logoutAllMutation.mutate()}
                    disabled={logoutAllMutation.isPending}
                  >
                    {logoutAllMutation.isPending ? "Yopilmoqda..." : "Barcha sessiyalarni yopish"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
