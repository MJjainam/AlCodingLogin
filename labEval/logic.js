var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;


const mongoose = require('mongoose'); // An Object-Document Mapper for Node.js
const assert = require('assert'); // N.B: Assert module comes bundled with Node.js.
mongoose.Promise = global.Promise; // Allows us to use Native promises without throwing error.

// Connect to a single MongoDB instance. The connection string could be that of remote server
// We assign the connection instance to a constant to be used later in closing the connection
const db = mongoose.connect('mongodb://localhost/loginApp');

// Converts value to lowercase
function toLower(v) {
	return v.toLowerCase();
}
/*
// Define a contact Schema
const userSchema = mongoose.Schema({
  //firstname: { type: String, set: toLower },
  username: { type: String, set: toLower },
  //phone: { type: String, set: toLower },
  //email: { type: String, set: toLower }
  password: { type: String, set: toLower}
});
*/
// Define model as an interface with the database
//const User = mongoose.model('User', userSchema);


var UserSchema = mongoose.Schema({
	username: {
		type: String,
		index: true,
		unique: true
	},
	password: {
		type: String
	},
	email: {
		type: String,
		unique: true
	},
	name: {
		type: String
	},
	isVerified: {
		type: Boolean,
		default: false
	},
	isLoggedIn: {
		type: Boolean,
		default: false
	}
});

var User = module.exports = mongoose.model('User', UserSchema);


/**
 * @function  [addContact]
 * @returns {String} Status
 
const register = (user) => {
  User.create(user, (err) => {
    assert.equal(null, err);
    console.info('Registered');
    db.disconnect();
  });
};
*/
/**
 * @function  [getContact]
 * @returns {Json} contacts
 */

///##### login requires editing
const login = (username, pass) => {
	console.log("before passport");
	passport.authenticate('login', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }),
		console.log("asd"),
		//function (req, res) {
		console.log("inside");
	var query = { username: username };
	User.findOne(query, function (err, user) {
		console.log(user + "user");
		user.isLoggedIn = true;
		console.log(user + "user");
		user.save(function (err) {
			if (err) { return res.status(500).send({ msg: err.message }); }
			else { console.log("right track"); }

		});
	});
		//		res.redirect('/');
		//	}	
		// Define search criteria. The search here is case-insensitive and inexact.
		/*  const search = new RegExp(name, 'i');
			User.find({$or: [{username: search }]})
			.exec((err, contact) => {
				assert.equal(null, err);
				console.info(contact);
				console.info(`${contact.length} matches`);
				db.disconnect();
			});*/
	};

	// Export all methods
	passport.use('login', new LocalStrategy({ passReqToCallback: true },
		function (req, username, password, done) {
			User.getUserByUsername(username, function (err, user) {
				if (err) throw err;
				if (!user) {
					return done(null, false, { message: 'Unknown User' });
				}
				/*	if (!user.isVerified) {
						return done(null, false, { message: 'User not verified yet' });
					}*/
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



	module.exports = {/*register,*/ login };
