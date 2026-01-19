const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    /** * NEW: Check for account activation
     * If the Admin hasn't approved the resident yet, is_active will be false.
     */
    if (decoded.is_active === false) {
      return res.status(403).json({ 
        success: false, 
        message: "Your account is pending admin approval." 
      });
    }

    req.user = decoded; 
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Middleware to restrict access by Role (e.g., Admin only)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role ${req.user.role} is not authorized for this resource.` 
      });
    }
    next();
  };
}
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: "Access denied. Admins only." 
    });
  }
};