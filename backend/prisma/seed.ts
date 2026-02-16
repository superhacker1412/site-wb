import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaClient, QuestionType, UserRole, EntityStatus } from "@prisma/client";

import { categories, materials } from "../../client/src/data/materials";
import { quizDirections, questions } from "../../client/src/data/questions";
import regionsJson from "../src/data/uzbekistan/regions.json";
import districtsJson from "../src/data/uzbekistan/districts.json";
import { DEFAULT_SITE_SETTINGS } from "../src/modules/site/default-settings";

const prisma = new PrismaClient();

const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin12345";
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);
const SCHOOL_TEMPLATES = [
  "1-sonli umumtalim maktabi",
  "12-sonli umumtalim maktabi",
  "25-sonli umumtalim maktabi",
];

const SPECIAL_SCHOOL_RULES = [
  {
    regionName: "Samarqand viloyati",
    districtName: "Bulung'ur tumani",
    schoolNames: ["36-sonli umumtalim maktabi"],
  },
  {
    regionName: "Jizzax viloyati",
    districtName: "Arnasoy tumani",
    schoolNames: ["1-sonli umumtalim maktabi"],
  },
  {
    regionName: "Toshkent shahri",
    districtName: "Uchtepa tumani",
    schoolNames: ["78-sonli umumtalim maktabi"],
  },
] as const;

type RegionRow = {
  id: number;
  soato_id: number;
  name_uz: string;
};

type DistrictRow = {
  id: number;
  region_id: number;
  soato_id: number;
  name_uz: string;
};

function toHtmlParagraphs(lines: string[]): string {
  return lines.map((line) => `<p>${line}</p>`).join("\n");
}

function mapQuestionType(type: "choice" | "truefalse" | "image"): QuestionType {
  if (type === "truefalse") return QuestionType.TRUE_FALSE;
  if (type === "image") return QuestionType.IMAGE;
  return QuestionType.CHOICE;
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/ʼ|‘|`/g, "'")
    .replace(/\s+/g, " ");
}

function districtStem(name: string): string {
  return normalizeName(name).replace(/\s+tumani$/i, "");
}

function isCityRow(name: string): boolean {
  const normalized = normalizeName(name);
  if (normalized.includes("tumanlari")) return false;
  return !normalized.includes("tumani");
}

function isDistrictRow(name: string): boolean {
  const normalized = normalizeName(name);
  return normalized.includes("tumani");
}

function toSlug(prefix: string, soatoId: number): string {
  return `${prefix}-${soatoId}`;
}

function slugifySchoolName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seedUzbekistanDirectories(): Promise<void> {
  const regionRows = regionsJson as RegionRow[];
  const locationRows = districtsJson as DistrictRow[];

  const regionIdByLegacyId = new Map<number, string>();
  const cityIdByRegionAndName = new Map<string, string>();

  for (const region of regionRows) {
    const slug = toSlug("uz-region", region.soato_id);
    const created = await prisma.region.upsert({
      where: { slug },
      update: {
        soatoId: region.soato_id,
        name: region.name_uz,
        status: EntityStatus.ACTIVE,
        archivedAt: null,
      },
      create: {
        soatoId: region.soato_id,
        slug,
        name: region.name_uz,
      },
      select: { id: true },
    });

    regionIdByLegacyId.set(region.id, created.id);
  }

  const cityRows = locationRows.filter((row) => isCityRow(row.name_uz));
  for (const row of cityRows) {
    const regionId = regionIdByLegacyId.get(row.region_id);
    if (!regionId) continue;

    const slug = toSlug("uz-city", row.soato_id);
    const city = await prisma.city.upsert({
      where: { slug },
      update: {
        soatoId: row.soato_id,
        regionId,
        name: row.name_uz,
        status: EntityStatus.ACTIVE,
        archivedAt: null,
      },
      create: {
        soatoId: row.soato_id,
        regionId,
        slug,
        name: row.name_uz,
      },
      select: { id: true, regionId: true, name: true },
    });

    const key = `${city.regionId}:${normalizeName(city.name)}`;
    cityIdByRegionAndName.set(key, city.id);
  }

  const districtRows = locationRows.filter((row) => isDistrictRow(row.name_uz));
  for (const row of districtRows) {
    const regionId = regionIdByLegacyId.get(row.region_id);
    if (!regionId) continue;

    const stem = districtStem(row.name_uz);
    const cityKey = `${regionId}:${stem}`;
    const cityId = cityIdByRegionAndName.get(cityKey) || null;

    const slug = toSlug("uz-district", row.soato_id);
    await prisma.district.upsert({
      where: { slug },
      update: {
        soatoId: row.soato_id,
        regionId,
        cityId,
        name: row.name_uz,
        status: EntityStatus.ACTIVE,
        archivedAt: null,
      },
      create: {
        soatoId: row.soato_id,
        regionId,
        cityId,
        slug,
        name: row.name_uz,
      },
    });
  }

  const districts = await prisma.district.findMany({
    select: { id: true, slug: true },
  });

  for (const district of districts) {
    for (const schoolName of SCHOOL_TEMPLATES) {
      const suffix = schoolName.replace(/\s+/g, "-").toLowerCase();
      const slug = `${district.slug}-${suffix}`;
      await prisma.school.upsert({
        where: { slug },
        update: {
          districtId: district.id,
          name: schoolName,
          status: EntityStatus.ACTIVE,
          archivedAt: null,
        },
        create: {
          districtId: district.id,
          slug,
          name: schoolName,
        },
      });
    }
  }
}

async function seedSpecialSchools(): Promise<void> {
  for (const rule of SPECIAL_SCHOOL_RULES) {
    const district = await prisma.district.findFirst({
      where: {
        name: rule.districtName,
        region: {
          name: rule.regionName,
        },
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!district) continue;

    for (const schoolName of rule.schoolNames) {
      const suffix = slugifySchoolName(schoolName);
      const slug = `${district.slug}-${suffix}`;
      await prisma.school.upsert({
        where: { slug },
        update: {
          districtId: district.id,
          name: schoolName,
          status: EntityStatus.ACTIVE,
          archivedAt: null,
        },
        create: {
          districtId: district.id,
          slug,
          name: schoolName,
        },
      });
    }
  }
}

async function seedAdmin(): Promise<void> {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  const mainAdmin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: ADMIN_NAME,
      role: UserRole.SUPER_ADMIN,
      passwordHash,
      status: EntityStatus.ACTIVE,
      archivedAt: null,
    },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: EntityStatus.ACTIVE,
    },
  });

  await prisma.user.updateMany({
    where: {
      role: UserRole.SUPER_ADMIN,
      id: { not: mainAdmin.id },
    },
    data: {
      role: UserRole.ADMIN,
    },
  });
}

async function seedCategories(): Promise<void> {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.id },
      update: {
        name: category.name,
        icon: category.icon,
        color: category.color,
        status: EntityStatus.ACTIVE,
        archivedAt: null,
      },
      create: {
        id: category.id,
        slug: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
      },
    });
  }
}

async function seedMaterials(): Promise<void> {
  for (const material of materials) {
    await prisma.material.upsert({
      where: { id: material.id },
      update: {
        categoryId: material.category,
        title: material.title,
        description: material.description,
        imagePath: material.image,
        contentHtml: toHtmlParagraphs(material.content),
        status: EntityStatus.ACTIVE,
        archivedAt: null,
      },
      create: {
        id: material.id,
        categoryId: material.category,
        title: material.title,
        description: material.description,
        imagePath: material.image,
        contentHtml: toHtmlParagraphs(material.content),
      },
    });
  }
}

async function seedDirectionsAndQuestions(): Promise<void> {
  for (const direction of quizDirections) {
    await prisma.quizDirection.upsert({
      where: { slug: direction.id },
      update: {
        name: direction.name,
        icon: direction.icon,
        description: direction.description,
        status: EntityStatus.ACTIVE,
        archivedAt: null,
      },
      create: {
        id: direction.id,
        slug: direction.id,
        name: direction.name,
        icon: direction.icon,
        description: direction.description,
      },
    });

    const directionQuestions = questions[direction.id] || [];
    for (const question of directionQuestions) {
      const options =
        question.options && question.options.length > 0
          ? question.options
          : ["To'g'ri", "Noto'g'ri"];

      await prisma.quizQuestion.upsert({
        where: { id: `${direction.id}-${question.id}` },
        update: {
          directionId: direction.id,
          type: mapQuestionType(question.type),
          questionText: question.question,
          optionsJson: options,
          imagePath: question.image || null,
          correctAnswerIndex: question.correctAnswer,
          explanationHtml: `<p>${question.explanation}</p>`,
          orderIndex: question.id,
          status: EntityStatus.ACTIVE,
          archivedAt: null,
        },
        create: {
          id: `${direction.id}-${question.id}`,
          directionId: direction.id,
          type: mapQuestionType(question.type),
          questionText: question.question,
          optionsJson: options,
          imagePath: question.image || null,
          correctAnswerIndex: question.correctAnswer,
          explanationHtml: `<p>${question.explanation}</p>`,
          orderIndex: question.id,
        },
      });
    }
  }
}

async function seedSiteSettings(): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { id: "main" },
    update: {},
    create: { ...DEFAULT_SITE_SETTINGS },
  });
}

async function main(): Promise<void> {
  await seedAdmin();
  await seedUzbekistanDirectories();
  await seedSpecialSchools();
  await seedCategories();
  await seedMaterials();
  await seedDirectionsAndQuestions();
  await seedSiteSettings();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed finished successfully.");
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
