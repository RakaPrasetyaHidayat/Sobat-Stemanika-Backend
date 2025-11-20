import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../config/supabase.js";
import { UnauthorizedError, ConflictError, ValidationError, DatabaseError } from "../utils/errors.js";

const baseUserFields = ["id", "nama", "role", "nisn_nip"].join(", ");
const fullUserFields = [baseUserFields, "password"].join(", ");
const knownJwtErrors = new Set(["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"]);

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
};

const verifyPassword = (password, stored) => {
  if (!stored || !stored.includes(":")) return false;
  const [salt, keyHex] = stored.split(":");
  const derived = crypto.scryptSync(password, salt, 64);
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== derived.length) return false;
  return crypto.timingSafeEqual(derived, key);
};

const sanitizeUser = (userRow) => {
  const { password, ...rest } = userRow || {};
  return rest;
};

const fetchUserByIdentifier = async (idNumber, fields = fullUserFields) => {
  const { data, error } = await supabase
    .from("Users")
    .select(fields)
    .eq("nisn_nip", idNumber)
    .maybeSingle();

  if (error) throw new DatabaseError(error.message);
  return data;
};

const fetchUserById = async (id, fields = baseUserFields) => {
  const { data, error } = await supabase
    .from("Users")
    .select(fields)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new DatabaseError(error.message);
  return data;
};

const issueServerToken = (userRow) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Server configuration error: JWT_SECRET is not configured");
  }

  const payload = {
    sub: userRow.id,
    role: userRow.role || "siswa",
    nisn_nip: userRow.nisn_nip,
    nama: userRow.nama
  };

  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

const resolveServerToken = async (token, secret) => {
  const payload = jwt.verify(token, secret);
  const user = await fetchUserById(payload.sub);
  if (!user) throw new UnauthorizedError();

  const normalized = {
    id: user.id,
    role: user.role || "siswa",
    email: payload.email || null,
    nama: user.nama,
    nisn_nip: user.nisn_nip
  };

  return { normalized, publicUser: user };
};

const resolveSupabaseToken = async (token) => {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) throw new UnauthorizedError();

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

const resolveAccessToken = async (token) => {
  if (!token) throw new UnauthorizedError();

  const secret = process.env.JWT_SECRET;
  if (secret) {
    try {
      return await resolveServerToken(token, secret);
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;

      const { name } = error || {};
      if (!knownJwtErrors.has(name)) throw new UnauthorizedError();
    }
  }

  return resolveSupabaseToken(token);
};

export const registerUser = async ({ nama, password, idNumber }) => {
  if (!nama || !password || !idNumber) {
    throw new ValidationError("nama, password, dan nisn/nip wajib");
  }

  const existing = await fetchUserByIdentifier(idNumber, "id");
  if (existing) throw new ConflictError("User sudah terdaftar");

  const passwordHash = hashPassword(password);
  const { data, error } = await supabase
    .from("Users")
    .insert({ nama, password: passwordHash, nisn_nip: idNumber })
    .select(baseUserFields)
    .single();

  if (error) throw new DatabaseError(error.message);
  return data;
};

export const authenticateUser = async ({ idNumber, password }) => {
  if (!idNumber || !password) {
    throw new ValidationError("nisn/nip dan password wajib");
  }

  const userRow = await fetchUserByIdentifier(idNumber);
  if (!userRow) throw new UnauthorizedError();

  const valid = verifyPassword(password, userRow.password);
  if (!valid) throw new UnauthorizedError();

  const accessToken = issueServerToken(userRow);
  if (!accessToken) {
    throw new Error("Gagal membuat token autentikasi");
  }

  return {
    accessToken,
    user: sanitizeUser(userRow)
  };
};

export const authorizeToken = async (token) => {
  const { normalized } = await resolveAccessToken(token);
  return normalized;
};

export const getProfileFromToken = async (token) => {
  const { publicUser } = await resolveAccessToken(token);
  return publicUser;
};

export const updateUserProfile = async (userId, { nama }) => {
  if (!userId) {
    throw new ValidationError("User ID is required");
  }

  const updatePayload = {};
  if (nama) {
    if (typeof nama !== 'string' || nama.trim().length < 2) {
      throw new ValidationError("Nama harus diisi dan minimal 2 karakter");
    }
    updatePayload.nama = nama.trim();
  }

  if (Object.keys(updatePayload).length === 0) {
    throw new ValidationError("No fields to update");
  }

  const { data, error } = await supabase
    .from("Users")
    .update(updatePayload)
    .eq("id", userId)
    .select(baseUserFields)
    .single();

  if (error) throw new DatabaseError(error.message);
  return data;
};
