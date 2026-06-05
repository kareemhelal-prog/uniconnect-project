const validator = require('validator');

// =======================
// EMAIL VALIDATION
// =======================
const validateEmail = (email) => {
  if (!email || !validator.isEmail(email)) {
    return false;
  }
  return true;
};

// =======================
// PASSWORD VALIDATION
// =======================
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return false;
  }
  // Check for uppercase, lowercase, number
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumber;
};

// =======================
// USERNAME VALIDATION
// =======================
const validateUsername = (username) => {
  if (!username) return false;
  // Only letters, numbers, underscores, hyphens
  const regex = /^[a-zA-Z0-9_-]{3,20}$/;
  return regex.test(username);
};

// =======================
// PAGINATION VALIDATION
// =======================
const validatePagination = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  
  return {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  };
};

// =======================
// STRING SANITIZATION
// =======================
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return validator.trim(validator.escape(str));
};

// =======================
// FILE TYPE VALIDATION
// =======================
const validateFileType = (mimetype, allowedTypes) => {
  return allowedTypes.includes(mimetype);
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  validatePagination,
  sanitizeString,
  validateFileType
};
