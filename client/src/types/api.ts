export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
export type EntityStatus = "ACTIVE" | "ARCHIVED";
export type QuestionType = "CHOICE" | "TRUE_FALSE" | "IMAGE";
export type QuizOptionType = "TEXT" | "IMAGE";

export interface RegionDirectory {
  id: string;
  slug: string;
  name: string;
  status: EntityStatus;
}

export interface CityDirectory {
  id: string;
  regionId: string;
  slug: string;
  name: string;
  status: EntityStatus;
}

export interface DistrictDirectory {
  id: string;
  regionId: string;
  cityId: string | null;
  slug: string;
  name: string;
  status: EntityStatus;
}

export interface SchoolDirectory {
  id: string;
  districtId: string;
  slug: string;
  name: string;
  status: EntityStatus;
}

export interface User {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  email: string;
  role: UserRole;
  status: EntityStatus;
  regionId?: string | null;
  cityId?: string | null;
  districtId?: string | null;
  customDistrictName?: string | null;
  schoolId?: string | null;
  customSchoolName?: string | null;
  gradeNumber?: number | null;
  gradeLetter?: string | null;
  region?: { id: string; name: string } | null;
  city?: { id: string; name: string } | null;
  district?: { id: string; name: string } | null;
  school?: { id: string; name: string } | null;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
  status: EntityStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  imagePath: string | null;
  contentHtml: string;
  status: EntityStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface QuizDirection {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  status: EntityStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  questionCount?: number;
}

export interface QuizQuestion {
  id: string;
  directionId?: string;
  type: QuestionType;
  questionText: string;
  options: Array<{
    type: QuizOptionType;
    text?: string;
    imagePath?: string | null;
  }>;
  imagePath: string | null;
  explanationHtml: string;
  orderIndex: number;
  status: EntityStatus;
  correctAnswerIndex?: number;
  direction?: {
    id: string;
    name: string;
  };
}

export interface QuizSubmitDetail {
  questionId: string;
  selectedAnswerIndex: number;
  correctAnswerIndex: number;
  isCorrect: boolean;
  explanationHtml: string;
  questionText: string;
}

export interface QuizAttempt {
  id: string;
  directionId: string;
  directionName: string;
  score: number;
  total: number;
  percentage: number;
  submittedAt: string;
}
