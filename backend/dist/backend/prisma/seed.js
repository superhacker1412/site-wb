"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const materials_1 = require("../../client/src/data/materials");
const questions_1 = require("../../client/src/data/questions");
const regions_json_1 = __importDefault(require("../src/data/uzbekistan/regions.json"));
const districts_json_1 = __importDefault(require("../src/data/uzbekistan/districts.json"));
const default_settings_1 = require("../src/modules/site/default-settings");
const prisma = new client_1.PrismaClient();
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
];
function toHtmlParagraphs(lines) {
    return lines.map((line) => `<p>${line}</p>`).join("\n");
}
function mapQuestionType(type) {
    if (type === "truefalse")
        return client_1.QuestionType.TRUE_FALSE;
    if (type === "image")
        return client_1.QuestionType.IMAGE;
    return client_1.QuestionType.CHOICE;
}
function normalizeName(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/ʼ|‘|`/g, "'")
        .replace(/\s+/g, " ");
}
function districtStem(name) {
    return normalizeName(name).replace(/\s+tumani$/i, "");
}
function isCityRow(name) {
    const normalized = normalizeName(name);
    if (normalized.includes("tumanlari"))
        return false;
    return !normalized.includes("tumani");
}
function isDistrictRow(name) {
    const normalized = normalizeName(name);
    return normalized.includes("tumani");
}
function toSlug(prefix, soatoId) {
    return `${prefix}-${soatoId}`;
}
function slugifySchoolName(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/'/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}
async function seedUzbekistanDirectories() {
    const regionRows = regions_json_1.default;
    const locationRows = districts_json_1.default;
    const regionIdByLegacyId = new Map();
    const cityIdByRegionAndName = new Map();
    for (const region of regionRows) {
        const slug = toSlug("uz-region", region.soato_id);
        const created = await prisma.region.upsert({
            where: { slug },
            update: {
                soatoId: region.soato_id,
                name: region.name_uz,
                status: client_1.EntityStatus.ACTIVE,
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
        if (!regionId)
            continue;
        const slug = toSlug("uz-city", row.soato_id);
        const city = await prisma.city.upsert({
            where: { slug },
            update: {
                soatoId: row.soato_id,
                regionId,
                name: row.name_uz,
                status: client_1.EntityStatus.ACTIVE,
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
        if (!regionId)
            continue;
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
                status: client_1.EntityStatus.ACTIVE,
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
                    status: client_1.EntityStatus.ACTIVE,
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
async function seedSpecialSchools() {
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
        if (!district)
            continue;
        for (const schoolName of rule.schoolNames) {
            const suffix = slugifySchoolName(schoolName);
            const slug = `${district.slug}-${suffix}`;
            await prisma.school.upsert({
                where: { slug },
                update: {
                    districtId: district.id,
                    name: schoolName,
                    status: client_1.EntityStatus.ACTIVE,
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
async function seedAdmin() {
    const passwordHash = await bcryptjs_1.default.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
    const mainAdmin = await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: {
            name: ADMIN_NAME,
            role: client_1.UserRole.SUPER_ADMIN,
            passwordHash,
            status: client_1.EntityStatus.ACTIVE,
            archivedAt: null,
        },
        create: {
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            passwordHash,
            role: client_1.UserRole.SUPER_ADMIN,
            status: client_1.EntityStatus.ACTIVE,
        },
    });
    await prisma.user.updateMany({
        where: {
            role: client_1.UserRole.SUPER_ADMIN,
            id: { not: mainAdmin.id },
        },
        data: {
            role: client_1.UserRole.ADMIN,
        },
    });
}
async function seedCategories() {
    for (const category of materials_1.categories) {
        await prisma.category.upsert({
            where: { slug: category.id },
            update: {
                name: category.name,
                icon: category.icon,
                color: category.color,
                status: client_1.EntityStatus.ACTIVE,
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
async function seedMaterials() {
    for (const material of materials_1.materials) {
        await prisma.material.upsert({
            where: { id: material.id },
            update: {
                categoryId: material.category,
                title: material.title,
                description: material.description,
                imagePath: material.image,
                contentHtml: toHtmlParagraphs(material.content),
                status: client_1.EntityStatus.ACTIVE,
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
async function seedDirectionsAndQuestions() {
    for (const direction of questions_1.quizDirections) {
        await prisma.quizDirection.upsert({
            where: { slug: direction.id },
            update: {
                name: direction.name,
                icon: direction.icon,
                description: direction.description,
                status: client_1.EntityStatus.ACTIVE,
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
        const directionQuestions = questions_1.questions[direction.id] || [];
        for (const question of directionQuestions) {
            const options = question.options && question.options.length > 0
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
                    status: client_1.EntityStatus.ACTIVE,
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
async function seedSiteSettings() {
    await prisma.siteSettings.upsert({
        where: { id: "main" },
        update: {},
        create: { ...default_settings_1.DEFAULT_SITE_SETTINGS },
    });
}
async function main() {
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
//# sourceMappingURL=seed.js.map