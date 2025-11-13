import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/httpError.js";

/**
 * Fetch list of all eskul entries
 * @returns {Promise<Array>} List of eskul entries ordered by creation date
 */
export const fetchEskulList = async () => {
  const fields = ["id", "nama", "deskripsi", "created_at"].join(", ");
  const query = supabase.from("Eskul").select(fields).order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw new HttpError(500, error.message);
  return data || [];
};
