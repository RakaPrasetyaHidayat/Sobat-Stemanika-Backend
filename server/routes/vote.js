import express from "express";
import { supabase } from "../config/supabase.js";
import { requireAuth, requireRole } from "./middleware.js";

const router = express.Router();

router.post("/", requireAuth, requireRole("siswa"), async (req, res) => {
  const userId = req.user.id;
  const { pemilihan, kandidat_id } = req.body; // pemilihan: ketua_osis|wakil_osis|ketua_mpk|wakil_mpk
  if (!pemilihan || !kandidat_id) return res.status(400).json({ error: "pemilihan & kandidat_id required" });

  const { data: existing, error: checkErr } = await supabase
    .from("Votes")
    .select("id")
    .eq("user_id", userId)
    .eq("pemilihan", pemilihan)
    .maybeSingle();
  if (checkErr) return res.status(400).json({ error: checkErr.message });
  if (existing) return res.status(409).json({ error: "Sudah memilih untuk pemilihan ini" });

  const { data, error } = await supabase
    .from("Votes")
    .insert({ user_id: userId, pemilihan, kandidat_id })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.get("/me", requireAuth, requireRole("siswa"), async (req, res) => {
  const { data, error } = await supabase.from("Votes").select("*").eq("user_id", req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.get("/results", async (req, res) => {
  const { pemilihan } = req.query;
  if (!pemilihan) return res.status(400).json({ error: "pemilihan required" });
  const { data: votes, error } = await supabase.from("Votes").select("kandidat_id").eq("pemilihan", pemilihan);
  if (error) return res.status(400).json({ error: error.message });
  const counts = {};
  for (const v of votes) counts[v.kandidat_id] = (counts[v.kandidat_id] || 0) + 1;
  res.json(counts);
});

export default router;
