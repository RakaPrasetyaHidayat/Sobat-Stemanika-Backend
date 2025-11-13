import { submitVote, fetchUserVotes, computeVoteResults } from "../services/voteService.js";
import { toHttpError } from "../utils/httpError.js";

export const createVote = async (req, res) => {
  try {
    const { record, isNew } = await submitVote(req.user.id, req.body || {});
    const statusCode = isNew ? 201 : 200;
    res.status(statusCode).json(record);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

export const myVotes = async (req, res) => {
  try {
    const data = await fetchUserVotes(req.user.id);
    res.json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

export const results = async (req, res) => {
  try {
    const data = await computeVoteResults(req.query.target_id);
    res.json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};
