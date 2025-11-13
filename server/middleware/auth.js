import { authorizeToken } from "../services/authService.js";
import { toHttpError } from "../utils/httpError.js";

export const requireAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    req.user = await authorizeToken(token);
    next();
  } catch (error) {
    const err = toHttpError(error, 401);
    res.status(err.status).json({ error: err.message });
  }
};

export const requireRole = (role) => (req, res, next) => {
  const userRole = req.user?.role;
  if (userRole !== role) return res.status(403).json({ error: "Forbidden" });
  next();
};
