import { registerUser, authenticateUser, getProfileFromToken, updateUserProfile } from "../services/authService.js";
import { ValidationError } from "../utils/errors.js";

const validateRegistrationInput = (data) => {
  const { nama, password, nisn_nip, nisn, nip } = data || {};

  if (!nama || typeof nama !== 'string' || nama.trim().length < 2) {
    throw new ValidationError("Nama harus diisi dan minimal 2 karakter");
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new ValidationError("Password harus diisi dan minimal 8 karakter");
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    throw new ValidationError("Password harus mengandung huruf besar, huruf kecil, dan angka");
  }

  const idNumber = nisn_nip ?? nisn ?? nip;
  if (!idNumber || typeof idNumber !== 'string' || idNumber.trim().length === 0) {
    throw new ValidationError("NISN atau NIP harus diisi");
  }

  return {
    nama: nama.trim(),
    password: password.trim(),
    idNumber: idNumber.trim()
  };
};

const validateLoginInput = (data) => {
  const { password, nisn_nip, nisn, nip } = data || {};

  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    throw new ValidationError("Password harus diisi");
  }

  const idNumber = nisn_nip ?? nisn ?? nip;
  if (!idNumber || typeof idNumber !== 'string' || idNumber.trim().length === 0) {
    throw new ValidationError("NISN atau NIP harus diisi");
  }

  return {
    password: password.trim(),
    idNumber: idNumber.trim()
  };
};

export const register = async (req, res) => {
  const validatedData = validateRegistrationInput(req.body);
  const user = await registerUser(validatedData);
  res.status(201).json({ message: "Register success", user });
};

export const login = async (req, res) => {
  const validatedData = validateLoginInput(req.body);
  const { accessToken, user } = await authenticateUser(validatedData);
  res.json({
    status: "success",
    message: "Login successful",
    data: {
      access_token: accessToken,
      user
    }
  });
};

export const me = async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const user = await getProfileFromToken(token);
  res.json({ user });
};

export const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { nama } = req.body;

  if (!nama || typeof nama !== 'string' || nama.trim().length < 2) {
    throw new ValidationError("Nama harus diisi dan minimal 2 karakter");
  }

  const user = await updateUserProfile(userId, { nama });
  res.json({ message: "Profil berhasil diperbarui", user });
};
