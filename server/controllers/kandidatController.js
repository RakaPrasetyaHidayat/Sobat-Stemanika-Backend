import {
  fetchKandidatList,
  createKandidatEntry,
  updateKandidatEntry,
  removeKandidatEntry
} from "../services/kandidatService.js";
import { toHttpError } from "../utils/httpError.js";

export const listKandidat = async (req, res) => {
  try {
    const data = await fetchKandidatList({ calon: req.query.calon });
    res.json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

export const createKandidat = async (req, res) => {
  try {
    const data = await createKandidatEntry(req.body || {});
    res.status(201).json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

export const updateKandidat = async (req, res) => {
  try {
    const data = await updateKandidatEntry(req.params.id, req.body || {});
    res.json(data);
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

export const deleteKandidat = async (req, res) => {
  try {
    await removeKandidatEntry(req.params.id);
    res.status(204).end();
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};
