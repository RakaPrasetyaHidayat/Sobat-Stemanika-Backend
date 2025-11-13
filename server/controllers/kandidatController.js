import {
  fetchKandidatList,
  createKandidatEntry,
  updateKandidatEntry,
  removeKandidatEntry
} from "../services/kandidatService.js";
import { toHttpError, createValidationError } from "../utils/httpError.js";

/**
 * Validate kandidat input data
 * @param {Object} data - Input data
 * @returns {Object} Validated and sanitized data
 */
const validateKandidatInput = (data) => {
  const { nama_kandidat, nomor_kandidat, img_url, calon, tagline } = data || {};

  if (!nama_kandidat || typeof nama_kandidat !== 'string' || nama_kandidat.trim().length < 2) {
    throw createValidationError("Nama kandidat harus diisi dan minimal 2 karakter");
  }

  if (!nomor_kandidat || typeof nomor_kandidat !== 'number' || nomor_kandidat < 1) {
    throw createValidationError("Nomor kandidat harus berupa angka positif");
  }

  if (!img_url || typeof img_url !== 'string' || img_url.trim().length === 0) {
    throw createValidationError("URL gambar harus diisi");
  }

  if (!calon || typeof calon !== 'string' || calon.trim().length === 0) {
    throw createValidationError("Calon harus diisi");
  }

  if (tagline && typeof tagline !== 'string') {
    throw createValidationError("Tagline harus berupa string");
  }

  return {
    nama_kandidat: nama_kandidat.trim(),
    nomor_kandidat: Math.floor(nomor_kandidat),
    img_url: img_url.trim(),
    calon: calon.trim(),
    tagline: tagline ? tagline.trim() : null
  };
};

/**
 * List kandidat entries with optional filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const listKandidat = async (req, res) => {
  try {
    const data = await fetchKandidatList({ calon: req.query.calon });
    res.json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

/**
 * Create a new kandidat entry
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const createKandidat = async (req, res) => {
  try {
    const validatedData = validateKandidatInput(req.body);
    const data = await createKandidatEntry(validatedData);
    res.status(201).json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

/**
 * Update an existing kandidat entry
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const updateKandidat = async (req, res) => {
  try {
    const validatedData = validateKandidatInput(req.body);
    const data = await updateKandidatEntry(req.params.id, validatedData);
    res.json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

/**
 * Delete a kandidat entry
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const deleteKandidat = async (req, res) => {
  try {
    await removeKandidatEntry(req.params.id);
    res.status(204).end();
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};
