const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'admin') {
            return res.redirect('/dashboard');
        }
        return res.redirect('/home');
    }
    res.render('login', {
        error: req.flash('error'),
        success: req.flash('success')
    });
};

exports.postLogin = async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && await bcrypt.compare(password, user.password)) {
            // Check if the selected role matches the user's actual role
            const isAdmin = user.isAdmin === true || user.role === 'admin'; // Handle both schema possibilities just in case

            if (role === 'admin' && !isAdmin) {
                req.flash('error', 'Access denied. You are not an admin.');
                return res.redirect('/login');
            }

            req.session.user = {
                ...user._doc,
                role: isAdmin ? 'admin' : 'guest' // Standardize role in session
            };

            if (role === 'admin') {
                return res.redirect('/dashboard');
            } else {
                return res.redirect('/home');
            }
        } else {
            req.flash('error', 'Invalid email or password');
            res.redirect('/login');
        }
    } catch (err) {
        console.error(err);
        res.redirect('/login');
    }
};

exports.getRegister = (req, res) => {
    res.render('register');
};

exports.postRegister = async (req, res) => {
    const { name, email, password, phone, nationality } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
        req.flash('error', 'Email already registered');
        return res.redirect('/register');
    }
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash, phone, nationality, role: 'guest' });
    await user.save();
    req.flash('success', 'Registration successful! Please login.');
    res.redirect('/login');
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
};
