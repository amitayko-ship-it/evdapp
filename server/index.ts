import express from "express";
import session from "express-session";
import { router } from "./routes";
import { verifyEmailConnection } from "./outlook-email";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "evdapp-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

// Mount API routes
app.use("/api", router);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Verify email connection on startup
  const emailOk = await verifyEmailConnection();
  if (emailOk) {
    console.log("Email service connected successfully");
  } else {
    console.warn("Email service connection failed – check OUTLOOK_EMAIL / OUTLOOK_PASSWORD env vars");
  }
});

export default app;
