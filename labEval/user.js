const program = require('commander');
const fs = require('fs');
var inquirer = require('inquirer');


const loginCredentials = [
  {
    type : 'input',
    name : 'username',
    message : 'Enter username:'
  },
  {
    type : 'password',
    name : 'password',
    message : 'Enter password:'
  }
];

// Require logic.js file and extract controller functions using JS destructuring assignment
const registerCredentials = [
  {
    type : 'input',
    name : 'name',
    message : 'Enter name:'
  },
  {
    type : 'input',
    name : 'username',
    message : 'Enter username:'
  },
  {
    type : 'input',
    name : 'email',
    message : 'Enter email ID::'
  },
  {
    type : 'password',
    name : 'password',
    message : 'Enter password:'
  },
  {
    type : 'password',
    name : 'cPassword',
    message : 'Confirm password:'
  }
];
const { register, login, getUser, submit} = require('./logic');

program
  .version('0.0.1')
  .description('Contact management system');

  program
    .command('Register')
    .alias('a')
    .description('Register')
    .action(()=> {
      inquirer.prompt(registerCredentials).then(answers =>{
        if (answers.password === answers.cPassword) {
          register(answers.name, answers.username, answers.email, answers.password);
        }
        else {
          console.log("Passwords don't match! Try again");
        }
      })
    });

program
  .command('login <username> <password>')
  .alias('r')
  .description('login')
  .action((username,password) => login(username, password));

program
  .command('submit <PROBLEMCODE> <FILENAME>')
  .alias('s')
  .description('Submit the code')
  .action((PROBLEMCODE,FILENAME)=> {
    inquirer.prompt(loginCredentials).then(answers =>{
      submit(PROBLEMCODE,fs.readFileSync(__dirname +'/' +FILENAME),answers.username,answers.password,function(){
        process.exit();
      });
      // console.log("back to user.js");
      // process.exit();
    });
  });
program
  .command('user <x>')
  .alias('u')
  .action((x)=> getUser(x));

program.parse(process.argv);
