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
  // Preferred: call server-side RPC 'cast_vote' which uses auth.uid() to set
  // supabase_user_id and enforces one-vote-per-user. If RPC is not present,
  // fall back to an upsert approach.
  try {
    const rpcParams = { p_kandidat_id: target_id, p_vote_type: voteValue };
    // If caller provided a supabase user id, include it as optional param
    if (userId) rpcParams.p_user_id = userId;

    const { data, error } = await supabase.rpc("cast_vote", rpcParams);

    if (error) {
      // Handle known error messages from the RPC (e.g. user_has_already_voted)
      const msg = (error?.message || "").toLowerCase();
      if (msg.includes("user_has_already_voted") || msg.includes("already voted") || error?.code === "23505") {
        throw new HttpError(409, "User has already voted");
      }

      // If the function does not exist or other RPC error, fall through to upsert fallback
      if (!/function .*cast_vote/i.test(error?.message || "")) {
        throw new HttpError(500, error.message);
      }
    }

    // RPC may return the inserted row or a result set. Normalize to object
    const record = Array.isArray(data) ? data[0] : data;
    return { record: record || null, isNew: true };
  } catch (rpcErr) {
    // If the RPC wasn't available (or intentionally disabled), fallback to upsert
    if (!(rpcErr instanceof HttpError) || rpcErr.status === 500) {
      // attempt fallback upsert
      const payload = { user_id: userId, target_id, vote_type: voteValue };
      const { data, error } = await supabase
        .from("vote")
        .upsert(payload, { onConflict: "user_id,target_id" })
        .select()
        .single();

      if (error) {
        // unique violation or other db error
        const msg = (error?.message || "").toLowerCase();
        if (msg.includes("duplicate") || error?.code === "23505") {
          throw new HttpError(409, "User has already voted");
        }
        throw new HttpError(500, error.message);
      }

      return { record: data, isNew: false };
    }

    // rethrow known HttpError (like 409)
    throw rpcErr;
  }
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
