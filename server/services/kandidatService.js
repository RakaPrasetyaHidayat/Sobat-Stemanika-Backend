import { supabase } from "../config/supabase.js";
import { cacheGet, cacheSet } from "../config/redis.js";
import { DatabaseError } from "../utils/errors.js";

export const fetchKandidatList = async ({ calon } = {}) => {
  const fields = [
    "id",
    "nama_kandidat",
    "nomor_kandidat",
    "img_url",
    "calon",
    "tagline",
    "created_at"
  ].join(", ");
  let query = supabase.from("Kandidat").select(fields).order("nomor_kandidat", { ascending: true });
  if (calon) query = query.eq("calon", calon);
  const { data, error } = await query;
  if (error) throw new DatabaseError(error.message);
  return data || [];
};

export const createKandidatEntry = async ({ nama_kandidat, nomor_kandidat, img_url, calon, tagline }) => {
  const payload = { nama_kandidat, nomor_kandidat, img_url, calon, tagline };
  const { data, error } = await supabase.from("Kandidat").insert(payload).select().single();
  if (error) throw new DatabaseError(error.message);
  return data;
};

export const updateKandidatEntry = async (id, payload) => {
  const { data, error } = await supabase.from("Kandidat").update(payload).eq("id", id).select().single();
  if (error) throw new DatabaseError(error.message);
  return data;
};

export const removeKandidatEntry = async (id) => {
  const { error } = await supabase.from("Kandidat").delete().eq("id", id);
  if (error) throw new DatabaseError(error.message);
};
