const fs = require('fs');
const path = require('path');

module.exports = (...roles) => {
  // Flatten in case an array was passed
  const allowedRoles = roles.flat().map(r => r.toLowerCase());

  return (req, res, next) => {
    const userRole = req.user && req.user.role ? req.user.role.toLowerCase() : null;
    const logPath = path.join(__dirname, '../../logs/role_debug.log');
    
    // Ensure logs directory exists
    if (!fs.existsSync(path.dirname(logPath))) {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
    }

    const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} | User: ${req.user ? req.user.email : 'NONE'} | UserRole: ${userRole} | Allowed: ${allowedRoles}\n`;
    fs.appendFileSync(logPath, logEntry);

    if (!req.user || !userRole || !allowedRoles.includes(userRole)) {
      const denyEntry = `[DENIED] Role mismatch for ${req.user ? req.user.email : 'guest'}. Has: ${userRole}, Needs one of: ${allowedRoles}\n`;
      fs.appendFileSync(logPath, denyEntry);
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
