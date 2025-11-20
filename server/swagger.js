import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "STEMANIKA Voting System API",
      version: "1.0.0",
      description: "API Documentation untuk Sistem Voting STEMANIKA",
      contact: {
        name: "STEMANIKA Team",
        url: "https://stemanika.com"
      }
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development Server (Local)"
      },
      {
        url: "http://localhost:5000",
        description: "Development Server (Port 5000)"
      },
      {
        url: "https://sobat-stemanika.vercel.app",
        description: "Production Server (Vercel Deployment)"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Authorization header using the Bearer scheme"
        }
      }
    }
  },
  apis: ["./server/server.js", "./server/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
export const swaggerUiMiddleware = swaggerUi;
