import { supabase } from "../config/supabase.js";
import { HttpError } from "../utils/httpError.js";

/**
 * Fetch list of kandidat entries with optional filtering
 * @param {Object} options - Query options
 * @param {string} [options.calon] - Filter by calon type
 * @returns {Promise<Array>} List of kandidat entries
 */
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
  if (error) throw new HttpError(500, error.message);
  return data || [];
};

/**
 * Create a new kandidat entry
 * @param {Object} kandidatData - Kandidat data
 * @param {string} kandidatData.nama_kandidat - Name of the kandidat
 * @param {number} kandidatData.nomor_kandidat - Kandidat number
 * @param {string} kandidatData.img_url - Image URL
 * @param {string} kandidatData.calon - Calon type
 * @param {string} kandidatData.tagline - Kandidat tagline
 * @returns {Promise<Object>} Created kandidat entry
 */
export const createKandidatEntry = async ({ nama_kandidat, nomor_kandidat, img_url, calon, tagline }) => {
  const payload = { nama_kandidat, nomor_kandidat, img_url, calon, tagline };
  const { data, error } = await supabase.from("Kandidat").insert(payload).select().single();
  if (error) throw new HttpError(500, error.message);
  return data;
};

/**
 * Update an existing kandidat entry
 * @param {string|number} id - Kandidat ID
 * @param {Object} payload - Update data
 * @returns {Promise<Object>} Updated kandidat entry
 */
export const updateKandidatEntry = async (id, payload) => {
  const { data, error } = await supabase.from("Kandidat").update(payload).eq("id", id).select().single();
  if (error) throw new HttpError(500, error.message);
  return data;
};

/**
 * Remove a kandidat entry
 * @param {string|number} id - Kandidat ID to remove
 * @returns {Promise<void>}
 */
export const removeKandidatEntry = async (id) => {
  const { error } = await supabase.from("Kandidat").delete().eq("id", id);
  if (error) throw new HttpError(500, error.message);
};
