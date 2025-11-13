import { submitVote, fetchUserVotes, computeVoteResults } from "../services/voteService.js";
import { toHttpError, createValidationError } from "../utils/httpError.js";

/**
 * Validate vote input data
 * @param {Object} data - Input data
 * @returns {Object} Validated and sanitized data
 */
const validateVoteInput = (data) => {
  const { target_id, vote_type } = data || {};

  if (!target_id) {
    throw createValidationError("target_id wajib diisi");
  }

  const voteValue = Number(vote_type);
  if (isNaN(voteValue) || (voteValue !== 1 && voteValue !== -1)) {
    throw createValidationError("vote_type harus 1 (upvote) atau -1 (downvote)");
  }

  return {
    target_id: String(target_id).trim(),
    vote_type: voteValue
  };
};

/**
 * Create or update a vote
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const createVote = async (req, res) => {
  try {
    const validatedData = validateVoteInput(req.body);
    const { record, isNew } = await submitVote(req.user.id, validatedData);
    const statusCode = isNew ? 201 : 200;
    res.status(statusCode).json(record);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

/**
 * Get current user's votes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const myVotes = async (req, res) => {
  try {
    const data = await fetchUserVotes(req.user.id);
    res.json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

/**
 * Validate target ID for results query
 * @param {string} targetId - Target ID from query
 * @returns {string} Validated target ID
 */
const validateTargetId = (targetId) => {
  if (!targetId || typeof targetId !== 'string' || targetId.trim().length === 0) {
    throw createValidationError("target_id wajib diisi dalam query parameter");
  }
  return targetId.trim();
};

/**
 * Get voting results for a target
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const results = async (req, res) => {
  try {
    const targetId = validateTargetId(req.query.target_id);
    const data = await computeVoteResults(targetId);
    res.json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};
