import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const { data, error } = await supabase.from("Eskul").select("*").order("created_at", { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
