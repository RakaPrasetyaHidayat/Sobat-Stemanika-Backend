import express from "express";
import { requireAuth, requireRole } from "./middleware.js";
import { createVote, myVotes, results } from "../controller/voteController.js";

const router = express.Router();

router.post("/", requireAuth, requireRole("siswa"), createVote);
router.get("/me", requireAuth, requireRole("siswa"), myVotes);
router.get("/results", results);

export default router;
