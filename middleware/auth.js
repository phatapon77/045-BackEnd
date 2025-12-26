// middleware/auth.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Format: Bearer <token>

  if (!token) {
    return res.status(403).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // เก็บข้อมูล user ไว้ใช้ใน route ถัดไป
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid Token' });
  }
};

module.exports = verifyToken;