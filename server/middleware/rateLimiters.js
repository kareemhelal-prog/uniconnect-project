// =====================================================================
// Rate limiters — brute-force / abuse protection on sensitive endpoints.
//
// These are a coarse, IP-based safety net. The strong per-account control
// for the OTP flow lives in the controller (a 5-guess-per-code counter),
// so even when many users share one egress IP (e.g. behind the Vite dev
// proxy or a reverse proxy) an attacker still can't grind a single code.
//
// Behind a real reverse proxy in production, set `app.set('trust proxy', 1)`
// so `req.ip` reflects the client and not the proxy.
// =====================================================================
const { rateLimit } = require("express-rate-limit");

const json = (message) => (req, res) =>
  res.status(429).json({ message });

// Login / register: stop credential-stuffing while staying generous enough
// that a shared IP of normal users is never locked out.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: json("Too many attempts. Please wait a few minutes and try again."),
});

// Requesting an OTP sends an email — keep this tight to prevent mail-bombing
// a victim's inbox and to slow enumeration.
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: json("Too many reset requests. Please wait a few minutes and try again."),
});

// Verifying an OTP / resetting the password.
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: json("Too many attempts. Please wait a few minutes and try again."),
});

module.exports = { authLimiter, otpRequestLimiter, otpVerifyLimiter };
