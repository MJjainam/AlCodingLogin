var mongoose = require('mongoose');

var ProblemSchema = new mongoose.Schema({
    name: String,

    // Required to be distinct
    code: String,

    description: String,
    points: Number,
    estimated_completion_time: Number,
    grading_type: String,

    // The stuff below makes sense only for auto grading
    input_format: String,
    output_format: String,
    constraints: String,
    time_limit: { type: Number, min:0, },
    memory_limit: { type: Number, min:0 },
    sample_input: String,
    sample_output: String,
    num_input_files: Number,

    // Should add up to 100
    // input_file_weights: [Number]
    input_file_weight: {type:Number}
    
});

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

var Problem = module.exports = mongoose.model('Problem', ProblemSchema);


