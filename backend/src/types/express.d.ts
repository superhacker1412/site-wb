import { UserRole, EntityStatus } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        firstName: string | null;
        lastName: string | null;
        middleName: string | null;
        role: UserRole;
        status: EntityStatus;
        regionId: string | null;
        cityId: string | null;
        districtId: string | null;
        customDistrictName: string | null;
        schoolId: string | null;
        customSchoolName: string | null;
        gradeNumber: number | null;
        gradeLetter: string | null;
        region: {
          id: string;
          name: string;
        } | null;
        city: {
          id: string;
          name: string;
        } | null;
        district: {
          id: string;
          name: string;
        } | null;
        school: {
          id: string;
          name: string;
        } | null;
      };
    }
  }
}

export {};
