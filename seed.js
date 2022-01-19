const db = require('./dataStore');

db.options.insert({ name: 'margin', value: 2 }, (err, doc) => {
    console.log(err)
    console.log(doc)
})

db.admin.insert({ username: 'paul', password: 'password'}, (err, doc) => {
    console.log(err)
    console.log(doc)
})