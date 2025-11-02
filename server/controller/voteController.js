import { supabase } from "../config/supabase.js";

export const createVote = async (req, res) => {
  const userId = req.user.id;
  const { pemilihan, kandidat_id } = req.body;
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
};

export const myVotes = async (req, res) => {
  const { data, error } = await supabase.from("Votes").select("*").eq("user_id", req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

export const results = async (req, res) => {
  const { pemilihan } = req.query;
  if (!pemilihan) return res.status(400).json({ error: "pemilihan required" });
  const { data: votes, error } = await supabase.from("Votes").select("kandidat_id").eq("pemilihan", pemilihan);
  if (error) return res.status(400).json({ error: error.message });
  const counts = {};
  for (const v of votes) counts[v.kandidat_id] = (counts[v.kandidat_id] || 0) + 1;
  res.json(counts);
};
