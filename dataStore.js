const DataStore = require('nedb');

const db = {};

db.trades = new DataStore({filename: __dirname + '/database/trades', autoload: true});

db.options = new DataStore({filename: __dirname + '/database/options', autoload: true});

db.admin = new DataStore({filename: __dirname + '/database/admin', autoload: true});

module.exports = db;