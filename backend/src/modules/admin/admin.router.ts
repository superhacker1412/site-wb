import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/role-guard";
import { adminUsersRouter } from "./users.router";
import { adminCategoriesRouter } from "./categories.router";
import { adminMaterialsRouter } from "./materials.router";
import { adminDirectionsRouter } from "./directions.router";
import { adminQuestionsRouter } from "./questions.router";
import { adminUploadsRouter } from "./uploads.router";
import { adminDashboardRouter } from "./dashboard.router";
import { adminAuditRouter } from "./audit.router";
import { adminFeedbackRouter } from "./feedback.router";
import { adminSiteRouter } from "./site.router";
import { adminLocationsRouter } from "./locations.router";
import { adminWordHtmRouter } from "./word-htm.router";

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

adminRouter.use("/dashboard", adminDashboardRouter);
adminRouter.use("/audit", adminAuditRouter);
adminRouter.use("/users", adminUsersRouter);
adminRouter.use("/categories", adminCategoriesRouter);
adminRouter.use("/materials", adminMaterialsRouter);
adminRouter.use("/quiz/directions", adminDirectionsRouter);
adminRouter.use("/quiz/questions", adminQuestionsRouter);
adminRouter.use("/uploads", adminUploadsRouter);
adminRouter.use("/word-htm", adminWordHtmRouter);
adminRouter.use("/feedback", adminFeedbackRouter);
adminRouter.use("/site", adminSiteRouter);
adminRouter.use("/locations", adminLocationsRouter);
