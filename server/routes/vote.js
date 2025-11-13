import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createVote, myVotes, results } from "../controllers/voteController.js";

const router = express.Router();

router.post("/", requireAuth, requireRole("siswa"), createVote);
router.get("/me", requireAuth, requireRole("siswa"), myVotes);
router.get("/results", results);

export default router;
