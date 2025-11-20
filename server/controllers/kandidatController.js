import {
  fetchKandidatList,
  createKandidatEntry,
  updateKandidatEntry,
  removeKandidatEntry
} from "../services/kandidatService.js";
import { ValidationError } from "../utils/errors.js";

const validateKandidatInput = (data) => {
  const { nama_kandidat, nomor_kandidat, img_url, calon, tagline } = data || {};

  if (!nama_kandidat || typeof nama_kandidat !== 'string' || nama_kandidat.trim().length < 2) {
    throw new ValidationError("Nama kandidat harus diisi dan minimal 2 karakter");
  }

  if (!nomor_kandidat || typeof nomor_kandidat !== 'number' || nomor_kandidat < 1) {
    throw new ValidationError("Nomor kandidat harus berupa angka positif");
  }

  if (!img_url || typeof img_url !== 'string' || img_url.trim().length === 0) {
    throw new ValidationError("URL gambar harus diisi");
  }

  if (!calon || typeof calon !== 'string' || calon.trim().length === 0) {
    throw new ValidationError("Calon harus diisi");
  }

  if (tagline && typeof tagline !== 'string') {
    throw new ValidationError("Tagline harus berupa string");
  }

  return {
    nama_kandidat: nama_kandidat.trim(),
    nomor_kandidat: Math.floor(nomor_kandidat),
    img_url: img_url.trim(),
    calon: calon.trim(),
    tagline: tagline ? tagline.trim() : null
  };
};

export const listKandidat = async (req, res) => {
  const data = await fetchKandidatList({ calon: req.query.calon });
  res.json(data);
};

export const createKandidat = async (req, res) => {
  const validatedData = validateKandidatInput(req.body);
  const data = await createKandidatEntry(validatedData);
  res.status(201).json(data);
};

export const updateKandidat = async (req, res) => {
  const validatedData = validateKandidatInput(req.body);
  const data = await updateKandidatEntry(req.params.id, validatedData);
  res.json(data);
};

export const deleteKandidat = async (req, res) => {
  await removeKandidatEntry(req.params.id);
  res.status(204).end();
};
