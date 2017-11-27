// var fs = require('fs');
// var async = require('async');
var mongoose = require('mongoose');
var mkdirp = require('mkdirp');
var fs = require('fs');
var formidable = require('formidable');
// var config = require('./config');
// var schema = require('./schema');


// ----------------------------------------
var Problem = require('../models/problem');
var express = require('express');
var router = express.Router();

router.get('/problem/add', function (req, res) {
    res.render('admin-problem-add'
    );
});

router.post('/problem/add', function (req, res, next) {

    var problem = new Problem();

    
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var creds = {};
        creds.code = fields.code;
        // Check for duplicate problem code
        Problem.findOne(creds, function (err, result) {
            if (err) {
                throw err;
                console.log(err);
            }
            else {
                if (result) {
                    // problem already exists
                    res.end("Problem code '" + form.code + "' already exists in database, please choose a new one and try again.");
                }
                else {
                    problem.name = fields.name;
                    problem.code = fields.code;
                    problem.description = fields.description;
                    problem.points = fields.points;
                    problem.estimated_completion_time = fields.estCompletionTime;
                    // problem.grading_type = form.grading_type;

                    problem.input_format = fields.input_format;
                    problem.output_format = fields.output_format;
                    problem.constraints = fields.constraints;
                    problem.time_limit = fields.time_limit;
                    problem.sample_input = fields.sample_input;
                    problem.sample_output = fields.sample_output;
                    problem.input_file_weight = 100;


                    var basedir = __dirname + '/../uploads/problems/' + problem.code;
                    // File handling stuff
                    mkdirp.sync(basedir + '/input/',function(err){
                        if(err){
                            console.log(err);
                        }
                        else{
                            console.log("created input");
                        }
                    });
                    mkdirp.sync(basedir + '/output/');

                    var data = fs.readFileSync(files.input.path);
                    var newPath = basedir + '/input/' + '0' + '.in';
                    fs.writeFileSync(newPath, data);

                    data = fs.readFileSync(files.output.path);
                    newPath = basedir + '/output/' + 0 + '.out';
                    fs.writeFileSync(newPath, data);

                    console.log("file added succesfully");

                    problem.save(function (err) {
                        if (err) {
                            console.log("error while saving" + err);
                            throw err;
                        }
                        else {
                            console.log("New problem added.");
                        }
                    });


                    res.render('admin-problem-add',{
                        msg:"problem added succesfully"
                    });
                }
            }
        });
    });
});

module.exports = router;