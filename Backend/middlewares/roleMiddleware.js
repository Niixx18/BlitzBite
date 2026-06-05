const User = require('../models/User');

exports.authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) return res.status(401).json({ message: 'Not authorized' });
      const user = await User.findById(req.user.id);
      if (!user) return res.status(401).json({ message: 'Not authorized' });
      if (!roles.includes(user.userType)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      next();
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  };
};
