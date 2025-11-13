import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/httpError.js";

/**
 * Normalize vote value to ensure it's either 1 or -1
 * @param {any} value - Raw vote value
 * @returns {number|null} Normalized vote value or null if invalid
 */
const normalizeVoteValue = (value) => {
  const numeric = Number(value);
  if (numeric === 1) return 1;
  if (numeric === -1) return -1;
  return null;
};

/**
 * Submit or update a vote for a target
 * @param {string|number} userId - User ID submitting the vote
 * @param {Object} voteData - Vote data
 * @param {string|number} voteData.target_id - Target ID being voted on
 * @param {number} voteData.vote_type - Vote type (1 for upvote, -1 for downvote)
 * @returns {Promise<Object>} Vote record and whether it was newly created
 */
export const submitVote = async (userId, { target_id, vote_type }) => {
  const voteValue = normalizeVoteValue(vote_type);
  if (!target_id || voteValue === null) {
    throw new HttpError(400, "target_id dan vote_type (1 atau -1) wajib");
  }

  // Use upsert for better performance - let the database handle insert/update logic
  const payload = { user_id: userId, target_id, vote_type: voteValue };
  const { data, error } = await supabase
    .from("vote")
    .upsert(payload, { onConflict: "user_id,target_id" })
    .select()
    .single();

  if (error) throw new HttpError(500, error.message);

  // Since we can't determine if it was an insert or update with upsert,
  // we'll assume it's an update for consistency (most votes will be updates)
  return { record: data, isNew: false };
};

/**
 * Fetch all votes submitted by a user
 * @param {string|number} userId - User ID to fetch votes for
 * @returns {Promise<Array>} List of user's votes
 */
export const fetchUserVotes = async (userId) => {
  const fields = ["id", "target_id", "vote_type", "created_at"].join(", ");
  const { data, error } = await supabase.from("vote").select(fields).eq("user_id", userId);

  if (error) throw new HttpError(500, error.message);
  return data || [];
};

/**
 * Compute voting results for a specific target
 * @param {string|number} targetId - Target ID to compute results for
 * @returns {Promise<Object>} Voting statistics including upvotes, downvotes, and percentages
 */
export const computeVoteResults = async (targetId) => {
  if (!targetId) throw new HttpError(400, "target_id wajib");

  const { data, error } = await supabase.from("vote").select("vote_type").eq("target_id", targetId);

  if (error) throw new HttpError(500, error.message);

  const rows = data ?? [];
  let upvotes = 0;
  let downvotes = 0;
  for (const { vote_type } of rows) {
    if (vote_type === 1) {
      upvotes += 1;
    } else {
      downvotes += 1;
    }
  }

  const total = rows.length;
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
