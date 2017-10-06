var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost/loginApp');
var db = mongoose.connection;


// User Schema
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
	}
});

var User = module.exports = mongoose.model('User', UserSchema);
var Token = require('./token');
module.exports.createUser = function (newUser, callback) {
	bcrypt.genSalt(10, function (err, salt) {
		bcrypt.hash(newUser.password, salt, function (err, hash) {
			newUser.password = hash;
			newUser.save(callback);
		});
	});
}

module.exports.getUserByUsername = function (username, callback) {
	var query = { username: username };
	User.findOne(query, callback);
}

module.exports.getUserById = function (id, callback) {
	User.findById(id, callback);
}

module.exports.comparePassword = function (candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
		if (err) throw err;
		callback(null, isMatch);
	});
}
module.exports.confirmationPost = function (req, res, next) {

	req.assert('token', 'Token cannot be blank').notEmpty();

	// Check for validation errors    
	var errors = req.validationErrors();
	if (errors) return res.status(400).send(errors);

	// Find a matching token
	Token.findOne({ token: req.params.token }, function (err, token) {
		if (!token) return res.status(400).send({ type: 'not-verified', msg: 'We were unable to find a valid token. Your token my have expired.' });

		// If we found a token, find a matching user
		User.findOne({ _id: token._userId }, function (err, user) {
			if (!user) return res.status(400).send({ msg: 'We were unable to find a user for this token.' });
			if (user.isVerified) return res.status(400).send({ type: 'already-verified', msg: 'This user has already been verified.' });

			// Verify and save the user
			user.isVerified = true;
			user.save(function (err) {
				if (err) {
					return User.sendMessage(res,'login',err.message);
				}
				else{
					console.log('Password changed');
					return User.sendMessage(res,'login',"User verified succesfully");
				}
			});
		});
	});
};

module.exports.sendMessage = function(res,page,message){
	return res.render(page,{
		errors:
		[{ msg: message }]
	});
}

module.exports.getUserList = function(callback){
	var userList = db.collection('users');
	userList.find().toArray(function (err, users) {
		// console.log(users);
		callback(users);
		
	});

	//res.render('user-list');
}