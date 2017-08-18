var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var UserSchema = mongoose.Schema({
	username: {
		type: String,
		index:true,
		unique: true
	},
	password: {
		type: String
	},
	email: {
		type: String
	//	unique : true
	},
	name: {
		type: String
	}
});

var User = module.exports = mongoose.model('User', UserSchema);
var Token = require('./token');
module.exports.createUser = function(newUser, callback){
		bcrypt.genSalt(10, function(err, salt) {
			bcrypt.hash(newUser.password, salt, function(err, hash) {
				newUser.password = hash;
				newUser.save(callback);
			});
		});
	}



module.exports.getUserByUsername = function(username, callback){
	var query = {username: username};
	User.findOne(query, callback);
}

module.exports.getUserById = function(id, callback){
	User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) throw err;
    	callback(null, isMatch);
	});
}
module.exports.confirmationPost = function (req, res, next) {

    /*Should correct this */
    console.log("asserting token");
    req.assert('token', 'Token cannot be blank').notEmpty();
    // req.sanitize('email').normalizeEmail({ remove_dots: false });
    console.log("asserted token");
    /* {end} Should correct this */

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
                if (err) { return res.status(500).send({ msg: err.message }); }
                res.status(200).send("The account has been verified. Please log in.");
                console.log('user registred');
				// res.redirect('/users/login');
				// req.flash('success_msg', 'You are registered and can now login');
            });
        });
    });
};