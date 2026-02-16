import {
  Category,
  CityDirectory,
  DistrictDirectory,
  Material,
  QuizDirection,
  QuizQuestion,
  RegionDirectory,
  SchoolDirectory,
  User,
} from "@/types/api";

export type AdminCategory = Category & {
  _count?: {
    materials: number;
  };
};

export type AdminMaterial = Material & {
  category?: Category;
};

export type AdminDirection = QuizDirection & {
  _count?: {
    questions: number;
  };
};

export type AdminQuestion = QuizQuestion & {
  direction?: {
    id: string;
    name: string;
  };
};

export type AdminRegion = RegionDirectory & {
  soatoId?: number | null;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    cities: number;
    districts: number;
    users: number;
  };
};

export type AdminCity = CityDirectory & {
  soatoId?: number | null;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  region?: {
    id: string;
    name: string;
  };
  _count?: {
    districts: number;
    users: number;
  };
};

export type AdminDistrict = DistrictDirectory & {
  soatoId?: number | null;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  region?: {
    id: string;
    name: string;
  };
  city?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    schools: number;
    users: number;
  };
};

export type AdminSchool = SchoolDirectory & {
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  district?: {
    id: string;
    name: string;
    region?: {
      id: string;
      name: string;
    };
    city?: {
      id: string;
      name: string;
    } | null;
  };
  _count?: {
    users: number;
  };
};

export type DashboardResponse = {
  kpi: {
    totalUsers: number;
    activeUsers: number;
    totalAttempts: number;
    averageScore: number;
    successRate: number;
  };
  charts: {
    attemptsByDay: Array<{ day: string; attempts: number }>;
    successByDay: Array<{ day: string; avgPercentage: number; successCount: number; totalCount: number }>;
    attemptsByDirection: Array<{ directionId: string; directionName: string; attempts: number }>;
    materialsByCategory: Array<{ categoryId: string; categoryName: string; materials: number }>;
  };
  latest: {
    newUsers: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      createdAt: string;
    }>;
    latestAttempts: Array<{
      id: string;
      score: number;
      total: number;
      percentage: number;
      submittedAt: string;
      user: { id: string; name: string; email: string };
      direction: { id: string; name: string };
    }>;
    recentAdminActions: Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string;
      createdAt: string;
      admin: { id: string; name: string; email: string };
    }>;
  };
  filters: {
    period: "7d" | "30d" | "90d" | "all";
    granularity: "day";
  };
};

export type InsightUser = User & {
  createdAt: string;
  updatedAt: string;
  stats: {
    attemptsCount: number;
    sessionsCount: number;
    favoriteMaterialsCount: number;
    favoriteDirectionsCount: number;
    averagePercentage: number;
    bestPercentage: number;
    successAttempts: number;
    lastAttemptAt: string | null;
    lastLoginAt: string | null;
    lastActiveAt: string | null;
  };
};

export type InsightAction = {
  id: string;
  type: string;
  at: string;
  user?: { id: string; name: string; email: string };
  meta?: Record<string, unknown>;
};

export type InsightsResponse = {
  users: InsightUser[];
  actions: InsightAction[];
};

export type AuditRecord = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: unknown;
  afterJson: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  admin: { id: string; name: string; email: string };
};

export type FeedbackStatus = "NEW" | "READ" | "RESOLVED" | "ARCHIVED";

export type FeedbackMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: FeedbackStatus;
  reviewedAt: string | null;
  reviewedById: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: { id: string; name: string; email: string } | null;
};

export type SiteAboutSettings = {
  id: string;
  aboutTitle: string;
  aboutSubtitle: string;
  aboutDescription: string;
  aboutMission: string;
  aboutAddress: string;
  aboutPhone: string;
  aboutEmail: string;
  aboutTelegram: string | null;
  aboutWorkingHours: string | null;
  updatedById: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  updatedBy?: { id: string; name: string; email: string } | null;
};

export type SiteFooterSettings = {
  id: string;
  footerBrand: string;
  footerDescription: string;
  footerPagesTitle: string;
  footerContactsTitle: string;
  footerLinkHomeLabel: string;
  footerLinkHomePath: string;
  footerLinkMaterialsLabel: string;
  footerLinkMaterialsPath: string;
  footerLinkQuizLabel: string;
  footerLinkQuizPath: string;
  footerLinkAboutLabel: string;
  footerLinkAboutPath: string;
  footerAddress: string;
  footerPhone: string;
  footerEmail: string;
  footerTelegram: string | null;
  footerWorkingHours: string | null;
  footerCopyright: string;
  updatedById: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  updatedBy?: { id: string; name: string; email: string } | null;
};
