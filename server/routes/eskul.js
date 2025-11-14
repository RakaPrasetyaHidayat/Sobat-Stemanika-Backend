import express from "express";
import { listEskul } from "../controllers/eskulController.js";

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
router.get("/", listEskul);

export default router;
