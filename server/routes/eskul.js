import express from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { listEskul, getEskulDetail, createEskul, updateEskul, deleteEskul } from "../controllers/eskulController.js";

const router = express.Router();

/**
 * @swagger
 * /api/eskul:
 *   get:
 *     summary: Get list of all ekstrakurikuler
 *     tags:
 *       - Ekstrakurikuler
 *     responses:
 *       200:
 *         description: List of ekstrakurikuler
 *       500:
 *         description: Server error
 */
router.get("/", asyncHandler(listEskul));

/**
 * @swagger
 * /api/eskul/{id}:
 *   get:
 *     summary: Get detail of an ekstrakurikuler
 *     tags:
 *       - Ekstrakurikuler
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Eskul detail
 *       404:
 *         description: Not found
 */
router.get("/:id", asyncHandler(getEskulDetail));

/**
 * @swagger
 * /api/eskul:
 *   post:
 *     summary: Create new ekstrakurikuler (admin only)
 *     tags:
 *       - Ekstrakurikuler
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Eskul created
 */
router.post("/", requireAuth, requireRole("admin"), asyncHandler(createEskul));

/**
 * @swagger
 * /api/eskul/{id}:
 *   patch:
 *     summary: Update ekstrakurikuler (admin only)
 *     tags:
 *       - Ekstrakurikuler
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Eskul updated
 */
router.patch("/:id", requireAuth, requireRole("admin"), asyncHandler(updateEskul));

/**
 * @swagger
 * /api/eskul/{id}:
 *   delete:
 *     summary: Delete ekstrakurikuler (admin only)
 *     tags:
 *       - Ekstrakurikuler
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
 *         description: Eskul deleted
 */
router.delete("/:id", requireAuth, requireRole("admin"), asyncHandler(deleteEskul));

export default router;
