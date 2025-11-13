import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/httpError.js";

const normalizeVoteValue = (value) => {
  const numeric = Number(value);
  if (numeric === 1) return 1;
  if (numeric === -1) return -1;
  return null;
};

export const submitVote = async (userId, { target_id, vote_type }) => {
  const voteValue = normalizeVoteValue(vote_type);
  if (!target_id || voteValue === null) {
    throw new HttpError(400, "target_id dan vote_type (1 atau -1) wajib");
  }

  const { data: existing, error: checkError } = await supabase
    .from("vote")
    .select("id")
    .eq("user_id", userId)
    .eq("target_id", target_id)
    .maybeSingle();

  if (checkError) throw new HttpError(400, checkError.message);

  if (existing) {
    const { data, error } = await supabase
      .from("vote")
      .update({ vote_type: voteValue })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw new HttpError(400, error.message);
    return { record: data, isNew: false };
  }

  const { data, error } = await supabase
    .from("vote")
    .insert({ user_id: userId, target_id, vote_type: voteValue })
    .select()
    .single();

  if (error) throw new HttpError(400, error.message);
  return { record: data, isNew: true };
};

export const fetchUserVotes = async (userId) => {
  const { data, error } = await supabase
    .from("vote")
    .select("*")
    .eq("user_id", userId);

  if (error) throw new HttpError(400, error.message);
  return data || [];
};

export const computeVoteResults = async (targetId) => {
  if (!targetId) throw new HttpError(400, "target_id wajib");

  const { data, error } = await supabase
    .from("vote")
    .select("vote_type")
    .eq("target_id", targetId);

  if (error) throw new HttpError(400, error.message);

  let upvotes = 0;
  let downvotes = 0;
  for (const vote of data || []) {
    if (vote.vote_type === 1) upvotes += 1;
    else downvotes += 1;
  }

  const total = (data || []).length;
  const percent_up = total ? Number(((upvotes / total) * 100).toFixed(2)) : 0;
  const percent_down = total ? Number(((downvotes / total) * 100).toFixed(2)) : 0;

  return {
    target_id: targetId,
    upvotes,
    downvotes,
    score: upvotes - downvotes,
    total,
    percent_up,
    percent_down
  };
};
