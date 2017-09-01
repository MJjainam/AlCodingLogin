var mongoose = require('mongoose');



var SubmissionSchema = new mongoose.Schema({
    problem_code: String,
    username: String,
    submission_date: { type: Date, default: Date.now },
    language: String,
    grading_type: String,

    // SHA 1 hash with file extension
    filename: String,

    judge_status : String,

    // Results for input files: 0 or 1
    judge_result_auto: [Number],

    // Result of manual grading
    judge_result_manual: Number,

    compile_error: String,
});

var Submission = module.exports = mongoose.model('Submission', SubmissionSchema);


