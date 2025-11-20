import voteRepository from '../repositories/voteRepository.js';
import { ValidationError, DuplicateVoteError, DatabaseError } from '../utils/errors.js';

const normalizeVoteValue = (value) => {
  const numeric = Number(value);
  if (numeric === 1) return 1;
  if (numeric === -1) return -1;
  return null;
};

export const submitVote = async (userId, { target_id, vote_type }) => {
  const voteValue = normalizeVoteValue(vote_type);
  if (!target_id || voteValue === null) {
    throw new ValidationError('target_id dan vote_type (1 atau -1) wajib');
  }

  try {
    const rpcParams = { p_kandidat_id: target_id, p_vote_type: voteValue };
    if (userId) rpcParams.p_user_id = userId;

    const record = await voteRepository.castVoteRpc(rpcParams);
    return { record: record || null, isNew: true };
  } catch (rpcErr) {
    if (rpcErr instanceof DuplicateVoteError) {
      throw rpcErr;
    }

    const fallbackRecord = await voteRepository.insertVoteUpsert(userId, target_id, voteValue);
    return { record: fallbackRecord, isNew: false };
  }
};

export const fetchUserVotes = async (userId) => {
  const votes = await voteRepository.findByUserId(userId);
  return votes || [];
};

export const computeVoteResults = async (targetId) => {
  if (!targetId) {
    throw new ValidationError('target_id wajib');
  }

  const votes = await voteRepository.findByTargetId(targetId);
  const rows = votes ?? [];

  let upvotes = 0;
  let downvotes = 0;
  for (const { vote_type } of rows) {
    if (vote_type === 1) upvotes += 1;
    else downvotes += 1;
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
