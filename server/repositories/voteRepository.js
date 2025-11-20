import { supabase } from '../config/supabase.js';
import { DatabaseError, NotFoundError, DuplicateVoteError } from '../utils/errors.js';

class VoteRepository {
  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('vote')
      .select('id, target_id, vote_type, created_at')
      .eq('user_id', userId);

    if (error) throw new DatabaseError(error.message);
    return data || [];
  }

  async findByTargetId(targetId) {
    const { data, error } = await supabase
      .from('vote')
      .select('vote_type')
      .eq('target_id', targetId);

    if (error) throw new DatabaseError(error.message);
    return data || [];
  }

  async castVoteRpc(params) {
    const { data, error } = await supabase.rpc('cast_vote', params);

    if (error) {
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('user_has_already_voted') || msg.includes('already voted') || error?.code === '23505') {
        throw new DuplicateVoteError();
      }
      if (msg.includes('target_not_found')) {
        throw new NotFoundError('Kandidat');
      }
      throw new DatabaseError(error.message);
    }

    const record = Array.isArray(data) ? data[0] : data;
    return record;
  }

  async insertVoteUpsert(userId, targetId, voteType) {
    const { data, error } = await supabase
      .from('vote')
      .upsert({ user_id: userId, target_id: targetId, vote_type: voteType }, { onConflict: 'user_id,target_id' })
      .select()
      .single();

    if (error) {
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('duplicate') || error?.code === '23505') {
        throw new DuplicateVoteError();
      }
      throw new DatabaseError(error.message);
    }

    return data;
  }
}

export default new VoteRepository();
