import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { QuizAttempt, User } from "@/types/api";

export interface TestResult {
  id: string;
  direction: string;
  directionName: string;
  score: number;
  total: number;
  percentage: number;
  date: string;
}

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  middleName: string;
  regionId: string;
  cityId?: string | null;
  districtId?: string | null;
  customDistrictName?: string | null;
  schoolId?: string | null;
  customSchoolName?: string | null;
  gradeNumber: number;
  gradeLetter: string;
  email: string;
  password: string;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  testHistory: TestResult[];
  refreshTestHistory: () => Promise<void>;
  favoriteMaterials: string[];
  toggleFavoriteMaterial: (id: string) => Promise<void>;
  favoriteTests: string[];
  toggleFavoriteTest: (id: string) => Promise<void>;
  refreshSessionData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAttempt(attempt: QuizAttempt): TestResult {
  return {
    id: attempt.id,
    direction: attempt.directionId,
    directionName: attempt.directionName,
    score: attempt.score,
    total: attempt.total,
    percentage: attempt.percentage,
    date: new Date(attempt.submittedAt).toLocaleDateString("uz-UZ"),
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [favoriteMaterials, setFavoriteMaterials] = useState<string[]>([]);
  const [favoriteTests, setFavoriteTests] = useState<string[]>([]);

  const refreshTestHistory = useCallback(async () => {
    const response = await apiFetch<{ history: QuizAttempt[] }>("/me/history");
    setTestHistory(response.history.map(mapAttempt));
  }, []);

  const refreshFavorites = useCallback(async () => {
    const [materials, directions] = await Promise.all([
      apiFetch<{ ids: string[] }>("/me/favorites/materials"),
      apiFetch<{ ids: string[] }>("/me/favorites/directions"),
    ]);
    setFavoriteMaterials(materials.ids);
    setFavoriteTests(directions.ids);
  }, []);

  const clearSessionState = useCallback(() => {
    setUser(null);
    setTestHistory([]);
    setFavoriteMaterials([]);
    setFavoriteTests([]);
  }, []);

  const refreshSessionData = useCallback(async () => {
    try {
      const me = await apiFetch<{ user: User }>("/auth/me", { retryOnAuthError: false });
      setUser(me.user);
      await Promise.all([refreshTestHistory(), refreshFavorites()]);
    } catch {
      clearSessionState();
    }
  }, [clearSessionState, refreshFavorites, refreshTestHistory]);

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);
      await refreshSessionData();
      setIsLoading(false);
    };
    void bootstrap();
  }, [refreshSessionData]);

  const login = useCallback(
    async (login: string, password: string) => {
      const response = await apiFetch<{ user: User }>("/auth/login", {
        method: "POST",
        body: { login, password },
      });
      setUser(response.user);
      await Promise.all([refreshTestHistory(), refreshFavorites()]);
    },
    [refreshFavorites, refreshTestHistory],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await apiFetch<{ user: User }>("/auth/register", {
        method: "POST",
        body: payload,
      });
      setUser(response.user);
      await Promise.all([refreshTestHistory(), refreshFavorites()]);
    },
    [refreshFavorites, refreshTestHistory],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      clearSessionState();
    }
  }, [clearSessionState]);

  const toggleFavoriteMaterial = useCallback(
    async (id: string) => {
      const exists = favoriteMaterials.includes(id);
      if (exists) {
        await apiFetch(`/me/favorites/materials/${id}`, { method: "DELETE" });
        setFavoriteMaterials((prev) => prev.filter((item) => item !== id));
      } else {
        await apiFetch(`/me/favorites/materials/${id}`, { method: "POST" });
        setFavoriteMaterials((prev) => [...prev, id]);
      }
    },
    [favoriteMaterials],
  );

  const toggleFavoriteTest = useCallback(
    async (id: string) => {
      const exists = favoriteTests.includes(id);
      if (exists) {
        await apiFetch(`/me/favorites/directions/${id}`, { method: "DELETE" });
        setFavoriteTests((prev) => prev.filter((item) => item !== id));
      } else {
        await apiFetch(`/me/favorites/directions/${id}`, { method: "POST" });
        setFavoriteTests((prev) => [...prev, id]);
      }
    },
    [favoriteTests],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        testHistory,
        refreshTestHistory,
        favoriteMaterials,
        toggleFavoriteMaterial,
        favoriteTests,
        toggleFavoriteTest,
        refreshSessionData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
