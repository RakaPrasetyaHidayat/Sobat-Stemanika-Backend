import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit',
  skipSuccessfulRequests: true,
});

export const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1,
  message: 'Anda sudah memberikan suara',
  skipSuccessfulRequests: false,
});
