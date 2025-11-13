import express from "express";
import { listEskul } from "../controllers/eskulController.js";

const router = express.Router();

router.get("/", listEskul);

export default router;
