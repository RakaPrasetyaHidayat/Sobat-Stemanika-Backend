import { fetchEskulList } from "../services/eskulService.js";
import { toHttpError } from "../utils/httpError.js";

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
