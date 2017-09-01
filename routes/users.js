var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Token = require('../models/token');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var formidable = require('formidable');
var mkdirp = require('mkdirp');
var fs = require('fs');

var utils = require('./utils');

var User = require('../models/user');  //model stores all the logical part. Importing 
var passwordReset = require('../models/password-reset');
var Problem = require('../models/problem');
var Submission = require('../models/submission');

// Register
router.get('/register', function (req, res) {
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

	req.getValidationResult()
		.then(function (result) {
			// return res.render('register', {
			// 	errors: result
			// });	
			// console.log(result.array());
		});

	var errors = req.validationErrors();

	if (errors) {
		req.flash('info', "User already exists");
		res.render('register', {
			errors: req.flash('info')
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
					console.log("see here: " + err.message);
					// console.log("---------" +typeof err.message);
					var field = err.message.split('index: ')[1];//.split('.$')[1]
					// now we have `email_1 dup key`
					//field = field.split(' dup key')[0]
					field = field.substring(0, field.lastIndexOf('_')) // returns email
					console.log("Field here: " + field);
					req.flash('error_msg', "User already exists");
					res.render('register', {
						errors:
						[{ msg: field + ' already exists' }]
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

					var transporter = nodemailer.createTransport("SMTP", { service: 'gmail', auth: { user: "algocodingpesu@gmail.com", pass: "algocoding2017" } });

					var mailOptions = { from: 'algocodingpesu@gmail.com', to: newUser.email, subject: 'Account Verification Token', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/users\/confirmation\/' + token.token + '\n' };
					transporter.sendMail(mailOptions, function (err) {
						if (err) { return res.status(500).send({ msg: err.message }); }
						res.status(200).send('A verification email has been sent to ' + newUser.email + '.');
					});
				});

			}
		});


	}
});

passport.use('login', new LocalStrategy({ passReqToCallback: true },
	function (req, username, password, done) {
		User.getUserByUsername(username, function (err, user) {
			if (err) throw err;
			if (!user) {
				return done(null, false, { message: 'Unknown User' });
			}
			if (!user.isVerified) {
				return done(null, false, { message: 'User not verified yet' });
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
	passport.authenticate('login', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }),
	function (req, res) {
		res.redirect('/');
	}
);


router.get('/logout', function (req, res) {
	req.session.destroy(function (err) {
		res.redirect('/users/login'); //Inside a callback… bulletproof!
	});
});

//Confirmation
router.get('/confirmation/:token', User.confirmationPost);


router.get('/password-reset', function (req, res) {
	res.render('password-reset');
});

router.post('/password-reset', function (req, res) {
	var email = req.body.email;
	console.log("in routes: " + email);
	passwordReset.getUserByEmail(req, res, email, passwordReset.sendPasswordResetLink);

});

router.get('/password-change/:token?', function (req, res) {
	console.log("in password change get");

	console.log(req.params.token);
	res.render('password-change');
});


router.post('/password-change/:token?', passwordReset.confirmPassword);



router.get('/problems', function (req, res) {
	// var ProblemSchema = schema.ProblemSchema;
	// var Problem = mongoose.model('Problem', ProblemSchema);

	// display problems sorted by name
	Problem.find({}, null, { sort: { name: 1 } }, function (err, problems) {
		if (err) {
			throw err;
			console.log(err);
		}
		else {
			res.render('problems', { problems: problems });
		}
	});
});

router.get('/submit', function (req, res, err) {
	res.render('submit');
});

router.post('/submit', ensureAuthenticated,function (req, res) {

	// var form = req.body;
	var form = new formidable.IncomingForm();
	form.parse(req, function (err, fields, files) {
		console.log(fields);
		console.log("in 214\n");
		var prob = {};
		prob.code = fields.code;
		console.log("in 216 " + prob.code);

		// Some server side validation.
		Problem.findOne(prob, function (err, problem) {
			if (err) {
				// throw err;
				console.log(err);

			}
			else {
				if (!problem) {
					res.end("Problem does not exist.");
					return;
				}
				// if (invalid(fields.language)) {
				// 	res.end("Language does not exist.");
				// 	return;
				// }
				console.log("in 233");


				// Language and Problem is valid, client ensures file is present
				// Create submission
				// var SubmissionSchema = schema.SubmissionSchema;
				// var Submission = mongoose.model('Submission', SubmissionSchema);

				var submission = new Submission();
				submission.problem_code = fields.code;
				submission.username = req.session.username;
				submission.language = fields.language;
				// submission.grading_type = problem.grading_type;

				// if (submission.grading_type == config.AUTO_GRADING) {
				//     submission.judge_status = config.judge_statuses.QUEUED;
				// }
				// else {
				//     submission.judge_status = config.judge_statuses.MANUAL_GRADE_PENDING;
				// }

				var filename = utils.generate_filename(fields.language);
				submission.filename = filename;

				submission.save(function (err) {
					if (err) {
						throw err;
						console.log(err);
					}
					else {
						console.log("Submission: " + submission.filename);
						var basedir = __dirname + '/../uploads/submissions';

						mkdirp.sync(basedir,function(err){
							if(err){
								console.log(err);
							}
							else{
								console.log("created input");
							}
						});

						var data = fs.readFileSync(files.file.path);
						var newPath = basedir + '/' + filename;
						fs.writeFileSync(newPath, data);
						// res.redirect('/queue');
						console.log("file uplaoded");
						res.end();
					}
				});
			}
		});

	});
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}
module.exports = router;