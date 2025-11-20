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

/**
 * Fetch detail of a specific eskul by ID
 * @param {string|number} id - Eskul ID
 * @returns {Promise<Object>} Eskul detail entry
 */
export const fetchEskulDetail = async (id) => {
  const fields = ["id", "nama", "deskripsi", "created_at"].join(", ");
  const { data, error } = await supabase
    .from("Eskul")
    .select(fields)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new HttpError(500, error.message);
  if (!data) throw new HttpError(404, "Eskul not found");
  return data;
};

/**
 * Create a new eskul entry
 * @param {Object} eskulData - Eskul data
 * @param {string} eskulData.nama - Eskul name
 * @param {string} eskulData.deskripsi - Eskul description
 * @returns {Promise<Object>} Created eskul entry
 */
export const createEskulEntry = async ({ nama, deskripsi }) => {
  const payload = { nama, deskripsi };
  const { data, error } = await supabase.from("Eskul").insert(payload).select().single();
  if (error) throw new HttpError(500, error.message);
  return data;
};

/**
 * Update an existing eskul entry
 * @param {string|number} id - Eskul ID
 * @param {Object} payload - Update data
 * @returns {Promise<Object>} Updated eskul entry
 */
export const updateEskulEntry = async (id, payload) => {
  const { data, error } = await supabase.from("Eskul").update(payload).eq("id", id).select().single();
  if (error) throw new HttpError(500, error.message);
  return data;
};

/**
 * Remove an eskul entry
 * @param {string|number} id - Eskul ID to remove
 * @returns {Promise<void>}
 */
export const removeEskulEntry = async (id) => {
  const { error } = await supabase.from("Eskul").delete().eq("id", id);
  if (error) throw new HttpError(500, error.message);
};
