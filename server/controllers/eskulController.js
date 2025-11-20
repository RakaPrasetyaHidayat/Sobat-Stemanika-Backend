import {
  fetchEskulList,
  fetchEskulDetail,
  createEskulEntry,
  updateEskulEntry,
  removeEskulEntry
} from "../services/eskulService.js";
import { ValidationError } from "../utils/errors.js";

const validateEskulInput = (data) => {
  const { nama, deskripsi } = data || {};

  if (!nama || typeof nama !== 'string' || nama.trim().length < 2) {
    throw new ValidationError("Nama eskul harus diisi dan minimal 2 karakter");
  }

  if (!deskripsi || typeof deskripsi !== 'string' || deskripsi.trim().length < 5) {
    throw new ValidationError("Deskripsi harus diisi dan minimal 5 karakter");
  }

  return {
    nama: nama.trim(),
    deskripsi: deskripsi.trim()
  };
};

export const listEskul = async (_req, res) => {
  const data = await fetchEskulList();
  res.json(data);
};

export const getEskulDetail = async (req, res) => {
  const data = await fetchEskulDetail(req.params.id);
  res.json(data);
};

export const createEskul = async (req, res) => {
  const validatedData = validateEskulInput(req.body);
  const data = await createEskulEntry(validatedData);
  res.status(201).json(data);
};

export const updateEskul = async (req, res) => {
  const validatedData = validateEskulInput(req.body);
  const data = await updateEskulEntry(req.params.id, validatedData);
  res.json(data);
};

export const deleteEskul = async (req, res) => {
  await removeEskulEntry(req.params.id);
  res.status(204).end();
};
