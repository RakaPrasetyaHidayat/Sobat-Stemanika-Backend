import { supabase } from "../config/supabase.js";

export const createVote = async (req, res) => {
  const userId = req.user.id;
  const { target_id, vote_type } = req.body || {};
  if (!target_id || ![1, -1].includes(Number(vote_type))) {
    return res.status(400).json({ error: "target_id dan vote_type (1 atau -1) wajib" });
  }

  const { data: existing, error: checkErr } = await supabase
    .from("vote")
    .select("id, vote_type")
    .eq("user_id", userId)
    .eq("target_id", target_id)
    .maybeSingle();
  if (checkErr) return res.status(400).json({ error: checkErr.message });

  if (existing) {
    const { data, error } = await supabase
      .from("vote")
      .update({ vote_type: Number(vote_type) })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  }

  const { data, error } = await supabase
    .from("vote")
    .insert({ user_id: userId, target_id, vote_type: Number(vote_type) })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

export const myVotes = async (req, res) => {
  const { data, error } = await supabase.from("vote").select("*").eq("user_id", req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

export const results = async (req, res) => {
  const { target_id } = req.query;
  if (!target_id) return res.status(400).json({ error: "target_id wajib" });
  const { data: votes, error } = await supabase.from("vote").select("vote_type").eq("target_id", target_id);
  if (error) return res.status(400).json({ error: error.message });
  let up = 0, down = 0;
  for (const v of votes) v.vote_type === 1 ? up++ : down++;
  const total = votes.length || 0;
  const percent_up = total ? Number(((up / total) * 100).toFixed(2)) : 0;
  const percent_down = total ? Number(((down / total) * 100).toFixed(2)) : 0;
  res.json({
    target_id,
    upvotes: up,
    downvotes: down,
    score: up - down,
    total,
    percent_up,
    percent_down,
  });
};
