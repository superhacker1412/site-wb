import { Router } from "express";

import { authRouter } from "./modules/auth/auth.router";
import { contentRouter } from "./modules/content/content.router";
import { quizRouter } from "./modules/quiz/quiz.router";
import { meRouter } from "./modules/me/me.router";
import { adminRouter } from "./modules/admin/admin.router";
import { healthRouter } from "./modules/health/health.router";
import { siteRouter } from "./modules/site/site.router";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/", contentRouter);
apiRouter.use("/quiz", quizRouter);
apiRouter.use("/me", meRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/site", siteRouter);
