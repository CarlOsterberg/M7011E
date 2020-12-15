const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 'T4C0T4C0';

bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
    console.log(hash)
});

