import {
  fetchEskulList,
  fetchEskulDetail,
  createEskulEntry,
  updateEskulEntry,
  removeEskulEntry
} from "../services/eskulService.js";
import { toHttpError, createValidationError } from "../utils/httpError.js";

/**
 * Validate eskul input data
 * @param {Object} data - Input data
 * @returns {Object} Validated and sanitized data
 */
const validateEskulInput = (data) => {
  const { nama, deskripsi } = data || {};

  if (!nama || typeof nama !== 'string' || nama.trim().length < 2) {
    throw createValidationError("Nama eskul harus diisi dan minimal 2 karakter");
  }

  if (!deskripsi || typeof deskripsi !== 'string' || deskripsi.trim().length < 5) {
    throw createValidationError("Deskripsi harus diisi dan minimal 5 karakter");
  }

  return {
    nama: nama.trim(),
    deskripsi: deskripsi.trim()
  };
};

/**
 * List all eskul entries
 * @param {Object} _req - Express request object (unused)
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const listEskul = async (_req, res) => {
  try {
    const data = await fetchEskulList();
    res.json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

/**
 * Get detail of a specific eskul
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getEskulDetail = async (req, res) => {
  try {
    const data = await fetchEskulDetail(req.params.id);
    res.json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

/**
 * Create a new eskul entry
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const createEskul = async (req, res) => {
  try {
    const validatedData = validateEskulInput(req.body);
    const data = await createEskulEntry(validatedData);
    res.status(201).json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

/**
 * Update an existing eskul entry
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const updateEskul = async (req, res) => {
  try {
    const validatedData = validateEskulInput(req.body);
    const data = await updateEskulEntry(req.params.id, validatedData);
    res.json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

/**
 * Delete an eskul entry
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const deleteEskul = async (req, res) => {
  try {
    await removeEskulEntry(req.params.id);
    res.status(204).end();
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};
