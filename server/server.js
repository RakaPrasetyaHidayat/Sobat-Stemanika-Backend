import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import eskulRoutes from "./routes/eskul.js";
import kandidatRoutes from "./routes/kandidat.js";
import voteRoutes from "./routes/vote.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("OK"));
app.use("/api/auth", authRoutes);
app.use("/api/eskul", eskulRoutes);
app.use("/api/kandidat", kandidatRoutes);
app.use("/api/vote", voteRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
