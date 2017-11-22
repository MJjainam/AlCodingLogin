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
const { register, login, getUser, submit} = require('./logic');

program
  .version('0.0.1')
  .description('Contact management system');

program
  .command('Register <name> <username> <email> <password> <confirmPassword>')
  .alias('a')
  .description('Register')
  .action((name, username, email, password, confirmPassword) => {
    register({name, username, email, password, confirmPassword});
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
      submit(PROBLEMCODE,fs.readFileSync(__dirname +'/' +FILENAME),answers.username,answers.password);

    })
  });
program
  .command('user <x>')
  .alias('u')
  .action((x )=> getUser(x));

program.parse(process.argv);
