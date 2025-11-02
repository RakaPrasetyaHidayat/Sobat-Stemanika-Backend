import { supabase } from "../config/supabase.js";

export const listKandidat = async (req, res) => {
  const { calon } = req.query;
  let query = supabase.from("Kandidat").select("*").order("nomor_kandidat", { ascending: true });
  if (calon) query = query.eq("calon", calon);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

export const createKandidat = async (req, res) => {
  const { nama_kandidat, nomor_kandidat, img_url, calon, tagline } = req.body;
  const { data, error } = await supabase
    .from("Kandidat")
    .insert({ nama_kandidat, nomor_kandidat, img_url, calon, tagline })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
};

export const updateKandidat = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("Kandidat").update(req.body).eq("id", id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

export const deleteKandidat = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("Kandidat").delete().eq("id", id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
};
