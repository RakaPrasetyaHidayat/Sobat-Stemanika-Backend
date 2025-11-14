import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createVote, myVotes, results } from "../controllers/voteController.js";

const router = express.Router();

/**
 * @swagger
 * /api/vote:
 *   post:
 *     summary: Create a vote (siswa only)
 *     tags:
 *       - Vote
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               kandidat_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Vote created successfully
 *       403:
 *         description: Forbidden (not siswa)
 */
router.post("/", requireAuth, requireRole("siswa"), createVote);

/**
 * @swagger
 * /api/vote/me:
 *   get:
 *     summary: Get my votes
 *     tags:
 *       - Vote
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User votes
 *       401:
 *         description: Unauthorized
 */
router.get("/me", requireAuth, requireRole("siswa"), myVotes);

/**
 * @swagger
 * /api/vote/results:
 *   get:
 *     summary: Get voting results
 *     tags:
 *       - Vote
 *     responses:
 *       200:
 *         description: Voting results
 *       500:
 *         description: Server error
 */
router.get("/results", results);

export default router;
