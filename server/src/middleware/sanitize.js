/**
 * SkillBridge NoSQL Injection Sanitization Middleware
 * 
 * Recursively cleans object keys in req.body, req.query, and req.params
 * to prevent MongoDB operator injection attacks (e.g., $gt, $ne, $where)
 * and dot-notation property path injection.
 * 
 * Crucially, only object KEYS are checked; string VALUES (such as email addresses,
 * websites, URLs, and currency figures containing '.' or '$') are fully preserved.
 */

const sanitizeKeys = (target) => {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map((item) => sanitizeKeys(item));
  }

  const cleanObj = {};
  for (const [key, value] of Object.entries(target)) {
    // Drop keys starting with '$' (MongoDB operator) or containing '.' (MongoDB field path)
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    cleanObj[key] = sanitizeKeys(value);
  }
  return cleanObj;
};

const sanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeKeys(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeKeys(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeKeys(req.params);
  }
  next();
};

module.exports = sanitize;
