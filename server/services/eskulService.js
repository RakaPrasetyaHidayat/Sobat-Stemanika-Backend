import { supabase } from "../config/supabase.js";
import { NotFoundError, DatabaseError } from "../utils/errors.js";

export const fetchEskulList = async () => {
  const fields = ["id", "nama", "deskripsi", "created_at"].join(", ");
  const query = supabase.from("Eskul").select(fields).order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw new DatabaseError(error.message);
  return data || [];
};

export const fetchEskulDetail = async (id) => {
  const fields = ["id", "nama", "deskripsi", "created_at"].join(", ");
  const { data, error } = await supabase
    .from("Eskul")
    .select(fields)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DatabaseError(error.message);
  if (!data) throw new NotFoundError("Eskul");
  return data;
};

export const createEskulEntry = async ({ nama, deskripsi }) => {
  const payload = { nama, deskripsi };
  const { data, error } = await supabase.from("Eskul").insert(payload).select().single();
  if (error) throw new DatabaseError(error.message);
  return data;
};

export const updateEskulEntry = async (id, payload) => {
  const { data, error } = await supabase.from("Eskul").update(payload).eq("id", id).select().single();
  if (error) throw new DatabaseError(error.message);
  return data;
};

export const removeEskulEntry = async (id) => {
  const { error } = await supabase.from("Eskul").delete().eq("id", id);
  if (error) throw new DatabaseError(error.message);
};
