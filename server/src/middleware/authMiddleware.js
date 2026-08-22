const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authorization = req.get('authorization');
  const token = authorization && authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured.');
    return res.status(503).json({ success: false, message: 'Authentication service is unavailable.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const role = String(payload.role || '').toUpperCase();

    if (!payload.userId || !['EMPLOYEE', 'ADMIN'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    req.user = {
      userId: payload.userId,
      employeeId: payload.employeeId || null,
      role
    };
    return next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }
}

module.exports = { authenticate };

