import express from "express";
import { listEskul } from "../controller/eskulController.js";

const router = express.Router();

router.get("/", listEskul);

export default router;
