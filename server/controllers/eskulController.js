import { fetchEskulList } from "../services/eskulService.js";
import { toHttpError } from "../utils/httpError.js";

export const listEskul = async (_req, res) => {
  try {
    const data = await fetchEskulList();
    res.json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};
