const db = require('./dataStore');

// db.options.insert({ name: 'margin', value: 2 }, (err, doc) => {
//     console.log(err)
//     console.log(doc)
// })

// db.admin.insert({ username: 'paul', password: 'password'}, (err, doc) => {
//     console.log(err)
//     console.log(doc)
// })

// db.pairs.insert([{symbol: 'BTCUSDT', inTrade: false}, {symbol: 'ETHUSDT', inTrade: false}])
db.pairs.update({symbol: 'ETHUSDT'}, {$set: {inTrade: false}})