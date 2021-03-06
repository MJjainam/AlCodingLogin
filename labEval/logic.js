
// change
var passport = require('passport');
var querystring = require('querystring');
var http = require('http');
var LocalStrategy = require('passport-local').Strategy;
var mkdirp = require('mkdirp');
var fs = require('fs');
var inquirer = require('inquirer');
var shell = require('shelljs');
var bcrypt = require('bcryptjs');
const { exec } = require('child_process');

const mongoose = require('mongoose'); // An Object-Document Mapper for Node.js
const assert = require('assert'); // N.B: Assert module comes bundled with Node.js.
mongoose.Promise = global.Promise; // Allows us to use Native promises without throwing error.

// Connect to a single MongoDB instance. The connection string could be that of remote server
// We assign the connection instance to a constant to be used later in closing the connection
const db = mongoose.connect('mongodb://localhost/loginApp', { useMongoClient: true });

// Converts value to lowercase
function toLower(v) {
	return v.toLowerCase();
}

//added security here
var security_default = require('./security-config.json5');

// for(let i = 0; i < security_default.security.length; i++) {
//   res.setHeader(
//     security_default.security[i].name,
//     security_default.security[i].value
//   );
// }
/////////


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


createUser = function (newUser, callback) {
	bcrypt.genSalt(10, function (err, salt) {
		bcrypt.hash(newUser.password, salt, function (err, hash) {
			newUser.password = hash;
			newUser.save(callback);
		});
	});
}

const submit = (PROBLEMCODE, data, username, password) => {
	// console.log(data.toString('utf8'));
	var post_data = querystring.stringify({
		'code': data.toString('utf8'),
		'username': username,
		'password': password,
		'problemCode': PROBLEMCODE
	});

	// An object of options to indicate where to post to
	var post_options = {
		host: 'localhost',
		port: '3000',
		path: '/code/upload',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(post_data),
			'Connection': 'close'
		}
	};

	// Set up the request
	var post_req = http.request(post_options, function (res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			console.log('Response: ' + chunk);
		});
		res.on('end', () => {
			// console.log('No more data in response.');
			//callback();
		});
	});

	post_req.write(post_data);
	post_req.end();


	var inputFile = '../uploads/problems/' + PROBLEMCODE + '/input/0.in';
	var outputFile = '../uploads/problems/' + PROBLEMCODE + '/output/0.out';
	var generatedOutput = '../uploads/submissions/' + username + '/' + PROBLEMCODE + '/output.txt';
	var dir = '../uploads/submissions/' + username + '/' + PROBLEMCODE + '/';

	fs.writeFileSync(__dirname + "/temp.py", data)
	shell.exec("chmod 777 temp.py");



	shell.exec('mkdir -p ' +dir );
	fs.writeFileSync(dir  + "code.py", data);
	shell.exec('touch ' + generatedOutput);
	shell.exec('chmod 777 ' + generatedOutput);
	shell.exec('python3 temp.py < ' + inputFile + ' > ' + generatedOutput, (err, stdout, stderr) => {
		if (err) {
			console.log("Compile error:" + stderr);
		}
		else if (stderr) {
			console.log("Runtime error" + stderr);
		}
		else {
			console.log("No runtime or compiler error");
			shell.exec("diff " + outputFile + " " + generatedOutput + " > final.txt");
			const stats = fs.statSync("final.txt");
			//console.log(stats.size+"\n");
			var submissionSuccessful = 0;
			if (stats.size == 0) {
				console.log("successful submission");
				submissionSuccessful = 1;

			}
			else {
				console.log("Test cases not passed");
			}

			var date = new Date();
			// console.log(date.getHours());
			var logString = username + "," + PROBLEMCODE + "," + date.getHours() + ":" + date.getMinutes();
			//console.log(submissionSuccessful)
			if (submissionSuccessful == 1) {
				logString = logString + ",success";
			}
			else {
				logString = logString + ",failed";
			}
			//console.log(logString);
			shell.exec("echo " + logString + " >> logSubmit.csv");
			process.exit();

		}


	});

	//  console.log("See output after this");
	// shell.exec('python3 temp.py < ../uploads/problems/' + PROBLEMCODE + '/input/0.in', (err, stdout, stderr) => {
	// 	if (err) {
	// 		console.log("Compiler error 2" +err);

	// 	}
	// 	console.log("stderr 2" + stderr);
	// 	console.log("stdout 2" + stdout);

	// 	//console.log("outside if");
	// });



	// console.log("submission completed : checking test cases");

	// exec("./a.out 1",(err,stdout,stderr) => {
	// 	if(err){
	// 		console.log(err);

	// 	}
	// 	console.log(__dirname);
	// });

	

}


const register = (name, username, email, password, confirmPassword) => {

	var newUser = new User({
		name: name,
		email: email,
		username: username,
		password: password
	});


	createUser(newUser, function (err, user) {
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

			// // Create a verification token for this user
			// var token = new Token({ _userId: newUser._id, token: crypto.randomBytes(16).toString('hex') });

			// // Save the verification token
			// token.save(function (err) {
			// 	if (err) { return res.status(500).send({ msg: err.message }); }

			// 	// Send the email
			// 	console.log("sending mail")

			// 	var transporter = nodemailer.createTransport("SMTP", { service: 'gmail', auth: { user: "algocodingpesu@gmail.com", pass: "algocoding2017" } });

			// 	var mailOptions = { from: 'algocodingpesu@gmail.com', to: newUser.email, subject: 'Account Verification Token', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/users\/confirmation\/' + token.token + '\n' };
			// 	transporter.sendMail(mailOptions, function (err) {
			// 		if (err) { return res.status(500).send({ msg: err.message }); }
			// 		res.status(200).send('A verification email has been sent to ' + newUser.email + '.');
			// 	});
			//});

		}



		// })
	});
}
const getUser = (x) => {
	console.log(req.user);
};

///##### login requires editing
const login = (username, pass) => {
	//console.log("before passport");
	passport.authenticate('login', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true });
	//console.log("asd"),
	//function (req, res) {
	//console.log("inside");
	var query = { username: username };
	User.findOne(query, function (err, user) {
		//console.log(user + "user");
		user.isLoggedIn = true;
		//console.log(user + "user");
		user.save(function (err) {
			if (err) { return res.status(500).send({ msg: err.message }); }
			else {
				//console.log("right track"); 
			}

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

	var date = new Date();
	var logLogin = username + "," + date.getHours() + ":" + date.getMinutes();
	shell.exec("echo " + logLogin + " >> logLogin.csv");
	process.exit();
};

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



// Export all methods
module.exports = { register, login, getUser, submit };
