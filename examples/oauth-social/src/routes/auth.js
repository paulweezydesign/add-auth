const express = require('express');
const passport = require('passport');

const router = express.Router();

function requireLoggedIn(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.status(401).json({ success: false, error: 'Not authenticated' });
}

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: true }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/', session: true }), (req, res) => {
  res.redirect('/');
});

router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: true }));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/', session: true }), (req, res) => {
  res.redirect('/');
});

// Account linking (must already be logged in)
router.get('/link/google', requireLoggedIn, (req, res, next) => {
  req.session.linkUserId = req.user.id;
  next();
}, passport.authenticate('google', { scope: ['profile', 'email'], session: true }));
router.get('/link/google/callback', requireLoggedIn, passport.authorize('google', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/');
});

router.get('/link/github', requireLoggedIn, (req, res, next) => {
  req.session.linkUserId = req.user.id;
  next();
}, passport.authenticate('github', { scope: ['user:email'], session: true }));
router.get('/link/github/callback', requireLoggedIn, passport.authorize('github', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/');
});

router.post('/logout', (req, res) => {
  // passport >=0.6 requires callback
  req.logout(() => {
    req.session?.destroy(() => {
      res.clearCookie('sid');
      res.json({ success: true, message: 'Logout successful' });
    });
  });
});

router.get('/me', (req, res) => {
  res.json({ success: true, data: { user: req.user || null } });
});

module.exports = router;

