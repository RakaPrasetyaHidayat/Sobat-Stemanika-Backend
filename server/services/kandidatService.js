import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/httpError.js";

export const fetchKandidatList = async ({ calon } = {}) => {
  let query = supabase.from("Kandidat").select("*").order("nomor_kandidat", { ascending: true });
  if (calon) query = query.eq("calon", calon);
  const { data, error } = await query;
  if (error) throw new HttpError(400, error.message);
  return data || [];
};

export const createKandidatEntry = async ({ nama_kandidat, nomor_kandidat, img_url, calon, tagline }) => {
  const payload = { nama_kandidat, nomor_kandidat, img_url, calon, tagline };
  const { data, error } = await supabase.from("Kandidat").insert(payload).select().single();
  if (error) throw new HttpError(400, error.message);
  return data;
};

export const updateKandidatEntry = async (id, payload) => {
  const { data, error } = await supabase.from("Kandidat").update(payload).eq("id", id).select().single();
  if (error) throw new HttpError(400, error.message);
  return data;
};

export const removeKandidatEntry = async (id) => {
  const { error } = await supabase.from("Kandidat").delete().eq("id", id);
  if (error) throw new HttpError(400, error.message);
};
