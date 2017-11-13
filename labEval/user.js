const program = require('commander');
// Require logic.js file and extract controller functions using JS destructuring assignment
const { register, login } = require('./logic');

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

program.parse(process.argv);
