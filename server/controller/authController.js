import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../config/supabase.js";

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

export const register = async (req, res) => {
  try {
    const { nama, password, nisn_nip, nisn, nip } = req.body || {};
    const idNum = nisn_nip ?? nisn ?? nip;
    if (!nama || !password || !idNum) return res.status(400).json({ error: "nama, password, dan nisn/nip wajib" });

    const { data: existedList, error: findErr } = await supabase.from("Users").select("id").eq("nisn_nip", idNum).limit(1);
    if (findErr) return res.status(500).json({ error: findErr.message });
    if (Array.isArray(existedList) && existedList.length > 0) return res.status(409).json({ error: "User sudah terdaftar" });

    const password_hash = hashPassword(password);
    const { data: inserted, error: insErr } = await supabase
      .from("Users")
      .insert({ nama, password: password_hash, nisn_nip: idNum })
      .select("id, nama, role, nisn_nip")
      .single();
    if (insErr) return res.status(400).json({ error: insErr.message });

    res.status(201).json({ message: "Register success", user: inserted });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { password, nisn_nip, nisn, nip } = req.body || {};
    const idNum = nisn_nip ?? nisn ?? nip;
    if (!idNum || !password) return res.status(400).json({ error: "nisn/nip dan password wajib" });

    const { data: userRow, error } = await supabase
      .from("Users")
      .select("id, nama, role, nisn_nip, password")
      .eq("nisn_nip", idNum)
      .single();

    if (error || !userRow) return res.status(401).json({ error: "Akun tidak ditemukan" });
    const ok = verifyPassword(password, userRow.password);
    if (!ok) return res.status(401).json({ error: "Password salah" });

    const jwtSecret = process.env.JWT_SECRET;
    let token = null;
    if (jwtSecret) {
      token = jwt.sign(
        { sub: userRow.id, role: userRow.role || "siswa", nisn_nip: userRow.nisn_nip, nama: userRow.nama },
        jwtSecret,
        { expiresIn: "7d" }
      );
    }

    const { password: _omit, ...publicUser } = userRow;
    res.json({
      status: "success",
      message: "Login successful",
      data: {
        access_token: token,
        user: publicUser
      }
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
};

export const me = async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    try {
      const payload = jwt.verify(token, jwtSecret);
      const { data: userRow } = await supabase
        .from("Users")
        .select("id, nama, role, nisn_nip")
        .eq("id", payload.sub)
        .single();
      if (userRow) return res.json({ user: userRow });
    } catch (_) {}
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: "Invalid token" });
  res.json({ user: data.user });
};
