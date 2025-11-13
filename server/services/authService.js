import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../config/supabase.js";
import { HttpError, isHttpError } from "../utils/httpError.js";

const baseUserFields = ["id", "nama", "role", "nisn_nip"].join(", ");
const fullUserFields = [baseUserFields, "password"].join(", ");
const knownJwtErrors = new Set(["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"]);

/**
 * Hash a password using scrypt
 * @param {string} password - Plain text password
 * @returns {string} Hashed password with salt
 */
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
};

/**
 * Verify a password against its hash
 * @param {string} password - Plain text password
 * @param {string} stored - Stored hash with salt
 * @returns {boolean} True if password matches
 */
const verifyPassword = (password, stored) => {
  if (!stored || !stored.includes(":")) return false;
  const [salt, keyHex] = stored.split(":");
  const derived = crypto.scryptSync(password, salt, 64);
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== derived.length) return false;
  return crypto.timingSafeEqual(derived, key);
};

/**
 * Remove sensitive fields from user object
 * @param {Object} userRow - Raw user data from database
 * @returns {Object} Sanitized user object without password
 */
const sanitizeUser = (userRow) => {
  const { password, ...rest } = userRow || {};
  return rest;
};

/**
 * Fetch user by NISN/NIP identifier
 * @param {string} idNumber - NISN or NIP number
 * @param {string} [fields] - Fields to select
 * @returns {Promise<Object|null>} User data or null if not found
 */
const fetchUserByIdentifier = async (idNumber, fields = fullUserFields) => {
  const { data, error } = await supabase
    .from("Users")
    .select(fields)
    .eq("nisn_nip", idNumber)
    .maybeSingle();

  if (error) throw new HttpError(500, error.message);
  return data;
};

/**
 * Fetch user by ID
 * @param {string|number} id - User ID
 * @param {string} [fields] - Fields to select
 * @returns {Promise<Object|null>} User data or null if not found
 */
const fetchUserById = async (id, fields = baseUserFields) => {
  const { data, error } = await supabase
    .from("Users")
    .select(fields)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new HttpError(500, error.message);
  return data;
};

/**
 * Generate JWT token for user
 * @param {Object} userRow - User data
 * @returns {string} JWT token
 * @throws {HttpError} If JWT_SECRET is not configured
 */
const issueServerToken = (userRow) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new HttpError(500, "Server configuration error: JWT_SECRET is not configured");
  }

  const payload = {
    sub: userRow.id,
    role: userRow.role || "siswa",
    nisn_nip: userRow.nisn_nip,
    nama: userRow.nama
  };

  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

/**
 * Verify and decode server JWT token
 * @param {string} token - JWT token
 * @param {string} secret - JWT secret
 * @returns {Promise<Object>} Decoded token payload with user data
 */
const resolveServerToken = async (token, secret) => {
  const payload = jwt.verify(token, secret);
  const user = await fetchUserById(payload.sub);
  if (!user) throw new HttpError(401, "Invalid token");

  const normalized = {
    id: user.id,
    role: user.role || "siswa",
    email: payload.email || null,
    nama: user.nama,
    nisn_nip: user.nisn_nip
  };

  return { normalized, publicUser: user };
};

/**
 * Verify Supabase JWT token
 * @param {string} token - Supabase JWT token
 * @returns {Promise<Object>} Decoded token payload with user data
 */
const resolveSupabaseToken = async (token) => {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, "Invalid token");

  const supaUser = data.user;
  const role = supaUser.user_metadata?.role || null;

  const publicUser = {
    id: supaUser.id,
    nama: supaUser.user_metadata?.nama || supaUser.email,
    role,
    nisn_nip: supaUser.user_metadata?.nisn_nip || null,
    email: supaUser.email
  };

  const normalized = {
    id: publicUser.id,
    role: publicUser.role,
    email: supaUser.email,
    raw: supaUser,
    nama: publicUser.nama,
    nisn_nip: publicUser.nisn_nip
  };

  return { normalized, publicUser };
};

/**
 * Resolve access token (JWT or Supabase)
 * @param {string} token - Access token
 * @returns {Promise<Object>} Token payload with user data
 */
const resolveAccessToken = async (token) => {
  if (!token) throw new HttpError(401, "Unauthorized");

  const secret = process.env.JWT_SECRET;
  if (secret) {
    try {
      return await resolveServerToken(token, secret);
    } catch (error) {
      if (isHttpError(error)) throw error;

      const { name } = error || {};
      if (!knownJwtErrors.has(name)) throw new HttpError(401, "Invalid token");
    }
  }

  return resolveSupabaseToken(token);
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.nama - User name
 * @param {string} userData.password - User password
 * @param {string} userData.idNumber - NISN or NIP number
 * @returns {Promise<Object>} Created user data
 */
export const registerUser = async ({ nama, password, idNumber }) => {
  if (!nama || !password || !idNumber) {
    throw new HttpError(400, "nama, password, dan nisn/nip wajib");
  }

  const existing = await fetchUserByIdentifier(idNumber, "id");
  if (existing) throw new HttpError(409, "User sudah terdaftar");

  const passwordHash = hashPassword(password);
  const { data, error } = await supabase
    .from("Users")
    .insert({ nama, password: passwordHash, nisn_nip: idNumber })
    .select(baseUserFields)
    .single();

  if (error) throw new HttpError(400, error.message);
  return data;
};

/**
 * Authenticate user with credentials
 * @param {Object} credentials - User credentials
 * @param {string} credentials.idNumber - NISN or NIP number
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Access token and user data
 */
export const authenticateUser = async ({ idNumber, password }) => {
  if (!idNumber || !password) {
    throw new HttpError(400, "nisn/nip dan password wajib");
  }

  const userRow = await fetchUserByIdentifier(idNumber);
  if (!userRow) throw new HttpError(401, "Akun tidak ditemukan");

  const valid = verifyPassword(password, userRow.password);
  if (!valid) throw new HttpError(401, "Password salah");

  const accessToken = issueServerToken(userRow);
  if (!accessToken) {
    throw new HttpError(500, "Gagal membuat token autentikasi");
  }

  return {
    accessToken,
    user: sanitizeUser(userRow)
  };
};

/**
 * Authorize token and return normalized user data
 * @param {string} token - Access token
 * @returns {Promise<Object>} Normalized user data
 */
export const authorizeToken = async (token) => {
  const { normalized } = await resolveAccessToken(token);
  return normalized;
};

/**
 * Get user profile from token
 * @param {string} token - Access token
 * @returns {Promise<Object>} Public user profile data
 */
export const getProfileFromToken = async (token) => {
  const { publicUser } = await resolveAccessToken(token);
  return publicUser;
};
