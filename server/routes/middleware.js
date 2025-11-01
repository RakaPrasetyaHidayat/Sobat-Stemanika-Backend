import { supabase } from "../config/supabase.js";
import jwt from "jsonwebtoken";

export const requireAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    // First: try to verify a server-signed JWT (if JWT_SECRET is set)
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      try {
        const payload = jwt.verify(token, jwtSecret);
        // Attach a normalized user object
        req.user = { id: payload.sub, role: payload.role, email: payload.email };
        return next();
      } catch (err) {
        // token may not be a server JWT — fall through to try Supabase
      }
    }

    // Fallback: accept Supabase access tokens (use Supabase to validate and fetch user)
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: "Invalid token" });

    // Normalize req.user so downstream code can use req.user.role
    const user = data.user;
    const role = user?.user_metadata?.role || null;
    req.user = { id: user.id, role, email: user.email, raw: user };
    next();
  } catch (e) {
    console.error("Auth middleware error", e?.message || e);
    res.status(500).json({ error: "Auth error" });
  }
};

export const requireRole = (role) => (req, res, next) => {
  const userRole = req.user?.role;
  if (userRole !== role) return res.status(403).json({ error: "Forbidden" });
  next();
};
