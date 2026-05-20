import express from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";

const cors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const origin = req.headers.origin;
  const allowed = process.env.ALLOWED_ORIGINS?.split(",") ?? [];
  if (origin && (allowed.includes(origin) || !process.env.ALLOWED_ORIGINS)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProd = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || (isProd ? 5000 : 3001);
const HOST = "0.0.0.0";

app.set("trust proxy", 1);
app.use(cors);
app.use(express.json());

const PgSession = ConnectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "even-derech-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    },
  })
);

registerRoutes(app);

if (isProd) {
  const publicDir = path.resolve(__dirname, "../public");
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
