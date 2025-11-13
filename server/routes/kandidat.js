import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listKandidat, createKandidat, updateKandidat, deleteKandidat } from "../controllers/kandidatController.js";

const router = express.Router();

router.get("/", listKandidat);
router.post("/", requireAuth, requireRole("admin"), createKandidat);
router.patch("/:id", requireAuth, requireRole("admin"), updateKandidat);
router.delete("/:id", requireAuth, requireRole("admin"), deleteKandidat);

export default router;
