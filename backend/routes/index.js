// すべてのルートをエクスポート
const authRoutes = require('./auth');
const bookRoutes = require('./books');
const noteRoutes = require('./notes');

module.exports = {
  authRoutes,
  bookRoutes,
  noteRoutes
};
