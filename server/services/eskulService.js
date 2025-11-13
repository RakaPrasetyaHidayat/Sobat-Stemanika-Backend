import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/httpError.js";

export const fetchEskulList = async () => {
  const { data, error } = await supabase.from("Eskul").select("*").order("created_at", { ascending: false });
  if (error) throw new HttpError(400, error.message);
  return data || [];
};
