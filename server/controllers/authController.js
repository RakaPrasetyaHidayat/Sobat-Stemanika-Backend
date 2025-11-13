import { registerUser, authenticateUser, getProfileFromToken } from "../services/authService.js";
import { toHttpError } from "../utils/httpError.js";

export const register = async (req, res) => {
  try {
    const { nama, password, nisn_nip, nisn, nip } = req.body || {};
    const idNumber = nisn_nip ?? nisn ?? nip;
    const user = await registerUser({ nama, password, idNumber });
    res.status(201).json({ message: "Register success", user });
  } catch (error) {
    const err = toHttpError(error);
    res.status(err.status).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { password, nisn_nip, nisn, nip } = req.body || {};
    const idNumber = nisn_nip ?? nisn ?? nip;
    const { accessToken, user } = await authenticateUser({ idNumber, password });
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
