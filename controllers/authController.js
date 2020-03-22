const passport = require('passport');

exports.login = passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: 'Failed login',
        successRedirect: '/',
        successFlash: 'Logged in successfully'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are logged out');
    res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) {
        next();
        return;
    }
    req.flash('error', 'Must be logged in to do that');
    res.redirect('/login');
};