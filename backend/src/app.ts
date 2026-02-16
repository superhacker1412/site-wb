import path from "path";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler, notFound } from "./middleware/error-handler";

export const app = express();

const allowedOrigins = env.CLIENT_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "uploads"), {
    dotfiles: "deny",
    index: false,
    maxAge: env.NODE_ENV === "production" ? "7d" : 0,
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);

app.use("/api/v1", apiRouter);

app.use(notFound);
app.use(errorHandler);
