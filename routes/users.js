var express = require('express');
var router = express.Router();

router.get('/register', function(req, res){
	res.render('register');
});

// Login
router.get('/login', function(req, res){
	res.render('login');
});

module.exports = router;