import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { swaggerUiMiddleware, swaggerSpec } from "./swagger.js";
import { supabase } from "./config/supabase.js";
import { initializeRedis } from "./config/redis.js";
import { addCacheHeaders, noCacheHeaders } from "./middleware/cacheMiddleware.js";
import authRoutes from "./routes/auth.js";
import eskulRoutes from "./routes/eskul.js";
import kandidatRoutes from "./routes/kandidat.js";
import voteRoutes from "./routes/vote.js";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}


const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_PUBLIC_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}


const app = express();

app.use(compression());

app.use(morgan('combined'));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Terlalu banyak permintaan dari IP ini, coba lagi dalam 15 menit',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Swagger documentation
app.use("/api-docs", swaggerUiMiddleware.serve, swaggerUiMiddleware.setup(swaggerSpec));

// Cache headers for static content
app.use(addCacheHeaders(3600));

/**
 * @swagger
 * /api/db-check:
 *   get:
 *     summary: Check database connection and table counts
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Database status check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 total_rows:
 *                   type: integer
 *                 summary:
 *                   type: object
 *                 details:
 *                   type: array
 *                 timestamp:
 *                   type: string
 *       500:
 *         description: Database check failed
 */
app.get("/api/db-check", async (_req, res) => {
  try {
    const tables = ["Users", "Eskul", "Kandidat", "vote"];

    const results = await Promise.all(
      tables.map(async (tableName) => {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true });

          return {
            table: tableName,
            count: count ?? 0,
            ok: !error,
            error: error?.message || null
          };
        } catch (err) {
          return {
            table: tableName,
            count: 0,
            ok: false,
            error: err.message || "Unknown error"
          };
        }
      })
    );

    const ok = results.every((result) => result.ok);
    const totalRows = results.reduce((sum, result) => sum + (result.count || 0), 0);
    const summary = Object.fromEntries(
      results.map((result) => [result.table, { count: result.count }])
    );

    res.json({
      ok,
      total_rows: totalRows,
      summary,
      details: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database check failed:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API health check
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
app.get("/", (_req, res) => {
  res.json({
    status: "OK",
    message: "STEMANIKA Voting System API",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/eskul", eskulRoutes);
app.use("/api/kandidat", kandidatRoutes);
app.use("/api/vote", voteRoutes);


app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `The requested endpoint ${req.method} ${req.path} does not exist`
  });
});


app.use((error, _req, res, _next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong"
  });
});


const PORT = process.env.PORT || 3000;

async function startServer() {
  await initializeRedis();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
  });

  return server;
}

const serverPromise = startServer();


process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  const server = await serverPromise;
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  const server = await serverPromise;
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;
