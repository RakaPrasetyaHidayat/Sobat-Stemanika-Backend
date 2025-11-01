import express from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  // For security, role is assigned server-side and cannot be set by the client.
  // Registrations via public API are always created with role = 'siswa'.
  const { email, password, nama, nisn_nip, nisn, nip } = req.body;
  const role = "siswa";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, nama, nisn_nip: nisn_nip ?? nisn ?? nip ?? null } },
  });

  if (error) return res.status(400).json({ error: error.message });

  const user = data.user;
  if (user) {
    await supabase.from("Users").upsert({ id: user.id, nama: nama ?? null, role, nisn_nip: nisn_nip ?? nisn ?? nip ?? null }).select();
  }

  res.status(201).json({ message: "Register success", user });
});

// Protected endpoint to create an admin user via server-side secret.
// This endpoint is intended for manual/admin setup and should not be public.
// Set ADMIN_SECRET in your .env and provide it in the `x-admin-secret` header.
router.post("/create-admin", async (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  const provided = req.headers["x-admin-secret"] || req.body.admin_secret;
  if (!secret) return res.status(500).json({ error: "ADMIN_SECRET not configured on server" });
  if (!provided || provided !== secret) return res.status(403).json({ error: "Forbidden" });

  const { email, password, nama, nisn_nip, nisn, nip } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email & password required" });

  const role = "admin";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, nama, nisn_nip: nisn_nip ?? nisn ?? nip ?? null } },
  });

  if (error) return res.status(400).json({ error: error.message });
  const user = data.user;
  if (user) {
    await supabase.from("Users").upsert({ id: user.id, nama: nama ?? null, role, nisn_nip: nisn_nip ?? nisn ?? nip ?? null }).select();
  }
  res.status(201).json({ message: "Admin created", user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  const user = data.user;

  // Try to determine role from profile table first, then from user metadata, then default to 'siswa'
  let role = user?.user_metadata?.role ?? "siswa";
  try {
    const { data: profile, error: profileError } = await supabase.from("Users").select("role").eq("id", user.id).single();
    if (!profileError && profile?.role) role = profile.role;
  } catch (e) {
    // ignore, keep role from metadata or default
  }

  // Generate server-signed JWT if JWT_SECRET is configured
  const jwtSecret = process.env.JWT_SECRET;
  let serverToken = null;
  if (jwtSecret) {
    try {
      serverToken = jwt.sign({ sub: user.id, role, email: user.email }, jwtSecret, { expiresIn: "7d" });
    } catch (e) {
      // If signing fails, we still return supabase token but log the error
      console.error("Failed to sign JWT:", e?.message || e);
    }
  }

  const response = { user };
  if (data.session?.access_token) response.access_token = data.session.access_token;
  if (serverToken) response.token = serverToken;
  else response.note = "Server JWT not configured (set JWT_SECRET in .env to enable server tokens).";

  res.json(response);
});

router.get("/me", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: "Invalid token" });
  res.json({ user: data.user });
});

export default router;