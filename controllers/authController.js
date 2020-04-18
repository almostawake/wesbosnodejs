const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

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

exports.forgot = async (req, res) => {
    const user = await User.findOne( {email: req.body.email});
    if (!user) {
        req.flash('error', 'I got nothing')
        return res.redirect('/login');
    }

    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

    await mail.send({
        user,
        subject: 'Password reset for Xyz Corp',
        resetURL,
        filename: 'password-reset'
    });


    req.flash('success', `Reset link sent`);
    res.redirect(`/login`);
};

exports.reset = async (req, res) => {

    const user = await User.findOne({
        resetPasswordToken: req.params.token, 
        resetPasswordExpires: { $gt: Date.now() } 
        });

    if(!user) {
        req.flash('error', 'Invalid or expired reset link');
        res.redirect(`/login`);
    }

    res.render('reset', { title: 'Reset your password'});

};

exports.confirmPasswordsMatch = (req, res, next) => {
    console.log('checking passwords match');
    if(req.body.password === req.body.confirm) {
            next();
            return;
    }
    req.flash('error', 'Passwords to not match'); 
    res.redirect('back');
};

exports.updatePassword = async (req, res) => {

    const user = await User.findOne({
        resetPasswordToken: req.params.token, 
        resetPasswordExpires: { $gt: Date.now() } 
        });

    if(!user) {
        req.flash('error', 'Invalid or expired reset link');
        res.redirect(`/login`);
    }

    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();

    await req.login(updatedUser);

    req.flash('success', 'Password updated');
    res.redirect('/');

}