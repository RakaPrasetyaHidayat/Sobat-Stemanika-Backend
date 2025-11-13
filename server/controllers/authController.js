import { registerUser, authenticateUser, getProfileFromToken } from "../services/authService.js";
import { toHttpError, createValidationError } from "../utils/httpError.js";

/**
 * Validate registration input
 * @param {Object} data - Input data
 * @returns {Object} Validated and sanitized data
 */
const validateRegistrationInput = (data) => {
  const { nama, password, nisn_nip, nisn, nip } = data || {};

  if (!nama || typeof nama !== 'string' || nama.trim().length < 2) {
    throw createValidationError("Nama harus diisi dan minimal 2 karakter");
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    throw createValidationError("Password harus diisi dan minimal 8 karakter");
  }

  // Check for basic password strength
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    throw createValidationError("Password harus mengandung huruf besar, huruf kecil, dan angka");
  }

  const idNumber = nisn_nip ?? nisn ?? nip;
  if (!idNumber || typeof idNumber !== 'string' || idNumber.trim().length === 0) {
    throw createValidationError("NISN atau NIP harus diisi");
  }

  return {
    nama: nama.trim(),
    password: password.trim(),
    idNumber: idNumber.trim()
  };
};

/**
 * Handle user registration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const register = async (req, res) => {
  try {
    const validatedData = validateRegistrationInput(req.body);
    const user = await registerUser(validatedData);
    res.status(201).json({ message: "Register success", user });
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

/**
 * Validate login input
 * @param {Object} data - Input data
 * @returns {Object} Validated and sanitized data
 */
const validateLoginInput = (data) => {
  const { password, nisn_nip, nisn, nip } = data || {};

  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    throw createValidationError("Password harus diisi");
  }

  const idNumber = nisn_nip ?? nisn ?? nip;
  if (!idNumber || typeof idNumber !== 'string' || idNumber.trim().length === 0) {
    throw createValidationError("NISN atau NIP harus diisi");
  }

  return {
    password: password.trim(),
    idNumber: idNumber.trim()
  };
};

/**
 * Handle user login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const login = async (req, res) => {
  try {
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
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const me = async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    const user = await getProfileFromToken(token);
    res.json({ user });
  } catch (error) {
    const err = toHttpError(error, 401);
    res.status(err.status).json({ error: err.message });
  }
};
