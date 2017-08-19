var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Token = require('../models/token');
var crypto = require('crypto');

var User = require('../models/user');  //model stores all the logical part. Importing 
										//functions assosiated with the user.

var passwordReset = require('../models/password-reset');

var nodemailer = require('nodemailer');

// Register
router.get('/register', function (req, res) {
	console.log("ad");
	res.render('register');
});

// Login
router.get('/login', function (req, res) {
	res.render('login');
});




// Register User
router.post('/register', function (req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;

	// Validation
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();

	if (errors) {
		console.log(errors);
		res.render('register', {
			errors: errors
		});
	} else {
		var newUser = new User({
			name: name,
			email: email,
			username: username,
			password: password
		});


		User.createUser(newUser, function (err, user) {
			if (err) {
				if (err.name === 'MongoError' && err.code === 11000) {
					// Duplicate username
					console.log(err);
					req.flash('error_msg', "User already exists");
					res.render('register', {
						errors:
						[{ msg: 'User already exists' }]
					});
				}
				else {
					return res.status(500).send({ msg: err.message });
				}
			}
			else {

				// Create a verification token for this user
				var token = new Token({ _userId: newUser._id, token: crypto.randomBytes(16).toString('hex') });

				// Save the verification token
				token.save(function (err) {
					if (err) { return res.status(500).send({ msg: err.message }); }

					// Send the email
					console.log("sending mail")

					var transporter = nodemailer.createTransport("SMTP", { service: 'gmail', auth: { user: "algocodingpesu@gmail.com", pass: "**********" } });

					var mailOptions = { from: 'algocodingpesu@gmail.com', to: newUser.email, subject: 'Account Verification Token', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
					transporter.sendMail(mailOptions, function (err) {
						if (err) { return res.status(500).send({ msg: err.message }); }
						res.status(200).send('A verification email has been sent to ' + newUser.email + '.');
					});
				});
				// console.log('user registred');
				// res.redirect('/users/login');
				// req.flash('success_msg', 'You are registered and can now login');
			}
		});


	}
});

passport.use(new LocalStrategy(
	function (username, password, done) {
		User.getUserByUsername(username, function (err, user) {
			if (err) throw err;
			if (!user) {
				return done(null, false, { message: 'Unknown User' });
			}

			User.comparePassword(password, user.password, function (err, isMatch) {
				if (err) throw err;
				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false, { message: 'Invalid password' });
				}
			});
		});
	}));

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.getUserById(id, function (err, user) {
		done(err, user);
	});
});

router.post('/login',
	passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }),
	function (req, res) {
		res.redirect('/');
	});

router.get('/logout', function (req, res) {
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/users/login');
});

//Confirmation
router.get('/confirmation/:token', User.confirmationPost);


router.get('/password-reset',function(req,res){
	res.render('password-reset');
});

router.post('/password-reset',function(req,res){
	var email = req.body.email;
	console.log("in routes: " +email);
	passwordReset.getUserByEmail(req,res,email,passwordReset.sendPasswordResetLink);

});

router.get('/password-change/:token',function(req,res){
	console.log("in password change get");
	console.log(req.params.token);
	res.render('password-change');
});

router.post('/password-change/:token',passwordReset.confirmPassword);







module.exports = router;