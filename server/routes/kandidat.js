import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listKandidat, createKandidat, updateKandidat, deleteKandidat } from "../controllers/kandidatController.js";

const router = express.Router();

/**
 * @swagger
 * /api/kandidat:
 *   get:
 *     summary: Get list of all candidates
 *     tags:
 *       - Kandidat
 *     responses:
 *       200:
 *         description: List of candidates
 *       500:
 *         description: Server error
 */
router.get("/", listKandidat);

/**
 * @swagger
 * /api/kandidat:
 *   post:
 *     summary: Create new candidate (admin only)
 *     tags:
 *       - Kandidat
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama:
 *                 type: string
 *               deskripsi:
 *                 type: string
 *     responses:
 *       201:
 *         description: Candidate created
 *       403:
 *         description: Forbidden (not admin)
 */
router.post("/", requireAuth, requireRole("admin"), createKandidat);

/**
 * @swagger
 * /api/kandidat/{id}:
 *   patch:
 *     summary: Update candidate (admin only)
 *     tags:
 *       - Kandidat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Candidate updated
 */
router.patch("/:id", requireAuth, requireRole("admin"), updateKandidat);

/**
 * @swagger
 * /api/kandidat/{id}:
 *   delete:
 *     summary: Delete candidate (admin only)
 *     tags:
 *       - Kandidat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Candidate deleted
 */
router.delete("/:id", requireAuth, requireRole("admin"), deleteKandidat);

export default router;
