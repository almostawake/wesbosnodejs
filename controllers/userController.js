const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');


exports.loginForm = (req, res) => {
    res.render('login', {title: 'Login'});
};

exports.registerForm = (req, res) => {
    res.render('register', {title: "Register"});
};

exports.validateRegistration = (req, res, next) => {
    req.sanitizeBody('name');
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email address format is not valid').isEmail({});
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extensions: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('password', 'Password required').notEmpty();
    req.checkBody('password-confirm', 'Password confirmation required').notEmpty();
    req.checkBody('password-confirm', 'Passwords do not match').equals(req.body.password);

    const errors = req.validationErrors();
    if (errors) {
        req.flash('error', errors.map(err => err.msg));
        res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
        return;
    }
    next();
};

exports.register = async (req, res, next) => {
    const user = new User ({ email: req.body.email, name: req.body.name});

    // User.register from passport uses callback not promise, so we'll use promisify
    const register = promisify(User.register, User); // promisify passport's register method
    await register(user, req.body.password); // look ma, no callback required :)
    next(); // goes to authController.login as per route for /register in index.js
};

exports.account = (req, res) => {
    res.render('account', { title: 'Edit Your Account'});
}

exports.updateAccount = async (req, res) => {

    
    const updates = {
        name: req.body.name,
        email: req.body.email
    };

    const user = await (User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: updates}, 
        { new: true, runValidators: true, context: 'query'}
    ))

    res.json(user)
}
