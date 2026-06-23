function isAdmin(req) {
  if (!req.user?.email) return false;
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(req.user.email.toLowerCase());
}

function requireAdmin(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { isAdmin, requireAdmin };
