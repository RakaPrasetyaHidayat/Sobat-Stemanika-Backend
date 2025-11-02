import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import eskulRoutes from "./routes/eskul.js";
import kandidatRoutes from "./routes/kandidat.js";
import voteRoutes from "./routes/vote.js";
import { supabase } from "./config/supabase.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/db-check", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("Users").select("id").limit(1);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, table: "Users", rows: Array.isArray(data) ? data.length : 0 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "error" });
  }
});

app.get("/", (_req, res) => res.send("OK"));
app.use("/api/auth", authRoutes);
app.use("/api/eskul", eskulRoutes);
app.use("/api/kandidat", kandidatRoutes);
app.use("/api/vote", voteRoutes);
app.get("/db-check", async (_req, res) => {
  try {
    const { data, error } = await supabase.from("Users").select("id").limit(1);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, table: "Users", rows: Array.isArray(data) ? data.length : 0 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
