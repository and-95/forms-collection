const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(12);
console.log(bcrypt.hashSync('Admin!', salt));