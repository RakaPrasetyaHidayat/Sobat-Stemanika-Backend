import cors from "cors";
import dotenv from "dotenv";
import express from "express";
// import helmet from "helmet"; // Recommended: npm install helmet

import { supabase } from "./config/supabase.js";
import authRoutes from "./routes/auth.js";
import eskulRoutes from "./routes/eskul.js";
import kandidatRoutes from "./routes/kandidat.js";
import voteRoutes from "./routes/vote.js";

// Load environment variables only in development
// In production (Vercel), environment variables are already injected
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_PUBLIC_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Initialize Express application
const app = express();

// Security middleware (recommended: install helmet)
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       scriptSrc: ["'self'"],
//       imgSrc: ["'self'", "data:", "https:"],
//     },
//   },
// }));

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

/**
 * Health check endpoint to verify database connectivity
 * @route GET /api/db-check
 * @returns {Object} Database status and table information
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
 * Root endpoint for basic connectivity check
 * @route GET /
 * @returns {string} OK status message
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

// 404 handler for undefined routes
app.all("*", (_req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: "The requested endpoint does not exist"
  });
});

// Global error handler
app.use((error, _req, res, _next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong"
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;
