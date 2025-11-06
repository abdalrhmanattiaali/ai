const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح بالوصول، الرجاء تسجيل الدخول'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'المستخدم غير موجود'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'الحساب غير مفعل'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'التوكن غير صالح'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `غير مصرح لـ ${req.user.role} بالوصول لهذا المورد`
      });
    }
    next();
  };
};
