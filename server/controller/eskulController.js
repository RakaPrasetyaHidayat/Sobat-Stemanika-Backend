import { supabase } from "../config/supabase.js";

export const listEskul = async (_req, res) => {
  const { data, error } = await supabase.from("Eskul").select("*").order("created_at", { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};
