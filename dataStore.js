const DataStore = require('nedb');

const db = {};

db.trades = new DataStore({filename: __dirname + '/database/trades', autoload: true});

db.options = new DataStore({filename: __dirname + '/database/options', autoload: true});

db.admin = new DataStore({filename: __dirname + '/database/admin', autoload: true});

db.pairs = new DataStore({filename: __dirname + '/database/pairs', autoload: true});

db.logs = new DataStore({filename: __dirname + '/database/logs', autoload: true});

db.logs.ensureIndex({ fieldName: 'createdAt', expireAfterSeconds: 24*60*60})

module.exports = db;