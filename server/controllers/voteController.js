import { submitVote, fetchUserVotes, computeVoteResults } from "../services/voteService.js";
import { ValidationError } from "../utils/errors.js";

const validateVoteInput = (data) => {
  const { target_id, vote_type } = data || {};

  if (!target_id) {
    throw new ValidationError("target_id wajib diisi");
  }

  const voteValue = Number(vote_type);
  if (isNaN(voteValue) || (voteValue !== 1 && voteValue !== -1)) {
    throw new ValidationError("vote_type harus 1 (upvote) atau -1 (downvote)");
  }

  return {
    target_id: String(target_id).trim(),
    vote_type: voteValue
  };
};

const validateTargetId = (targetId) => {
  if (!targetId || typeof targetId !== 'string' || targetId.trim().length === 0) {
    throw new ValidationError("target_id wajib diisi dalam query parameter");
  }
  return targetId.trim();
};

export const createVote = async (req, res) => {
  const validatedData = validateVoteInput(req.body);
  const { record, isNew } = await submitVote(req.user.id, validatedData);
  const statusCode = isNew ? 201 : 200;
  res.status(statusCode).json(record);
};

export const myVotes = async (req, res) => {
  const data = await fetchUserVotes(req.user.id);
  res.json(data);
};

export const results = async (req, res) => {
  const targetId = validateTargetId(req.query.target_id);
  const data = await computeVoteResults(targetId);
  res.json(data);
};
