// import { concat } from '../../../../.cache/typescript/2.6/node_modules/@types/async';

var fs = require('fs');
// var async = require('async');
var mongoose = require('mongoose');
var mkdirp = require('mkdirp');
// var fs = require('fs');
var formidable = require('formidable');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var crypto = require('crypto');
const { exec } = require("child_process");	


var User = require('../models/user');  //model stores all the logical part. Importing 




// ----------------------------------------
var Problem = require('../models/problem');
var express = require('express');
var router = express.Router();

router.post('/upload', function (req, res) {
    // console.log(newFilePath);
    // console.log(authenticate('jai', 'asd'));
    authenticate(req.body.username,req.body.password,function(err,user,message){
        if(err || !user){
            // console.log("problem is there");
            // console.log(message.message);
                        res.end(message.message);
        }
        else{
            // console.log("no problem");
            var newDirectory = __dirname + "/../uploads/submissions/" + req.body.username +"/" + req.body.problemCode +"/";
            var newFile =  "1.py"
            // console.log(__dirname);
            mkdirp.sync(newDirectory);
            fs.writeFileSync(newDirectory + newFile,req.body.code);
            //Irfan's code goes here
            //Do the compilation
            res.end("Your code is submitted and being compiled");       
        }
    });
    // console.log(req.body.code);
});


var authenticate = function (username, password,callback) {
    User.getUserByUsername(username, function (err, user) {
        if (err){
            callback(err);
        } 
        if (!user) {
            callback(null, false, { message: 'Unknown User' });
            // callback(err);
            // return false;

        }
        /*	if (!user.isVerified) {
                return done(null, false, { message: 'User not verified yet' });
            }
            */
        User.comparePassword(password, user.password, function (err, isMatch) {
            if (err){
                callback(err);
            } 
            if (isMatch) {
                callback(null, user);
                // return true;
            } else {
                callback(null, false, { message: 'Invalid password' });
                // return false;
            }
        });
    });
}

// var authenticate = function (username, password) {
    // var user = User.getUserByUsername(username,function(err,user){
    //     if(err){
    //         return null;
    //     }
    //     else{
    //         return user;
    //     }
    // });
    // console.log(user);
    // User.getUserByUsername(username, function (err, user) {
    //     if (err) throw err;
    //     if (!user) {
    //         return done(null, false, { message: 'Unknown User' });
    //         // return false;

    //     }
    //     /*	if (!user.isVerified) {
    //             return done(null, false, { message: 'User not verified yet' });
    //         }
    //         */
    //     User.comparePassword(password, user.password, function (err, isMatch) {
    //         if (err) throw err;
    //         if (isMatch) {
    //             return done(null, user);
    //             // return true;
    //         } else {
    //             return done(null, false, { message: 'Invalid password' });
    //             // return false;
    //         }
    //     });
    // });
// }


module.exports = router;
