const db = require("./dataStore");
const EventEmitter = require("events");
const logEmitter = new EventEmitter();

module.exports.emitLogs = (socket) => {
    logEmitter.on('message', data => {
        socket.emit('message', data);
    });
}

module.exports.log = (...messages) => {
    let message = '';
    messages.forEach(m => message += (m + ' '));
    let logData = {
        createdAt: new Date(),
        message: message.trim()
    };
    
    db.logs.insert(logData, (err, doc) => {
        if(!err) logEmitter.emit('message', doc);
    });
}

module.exports.getLogs = () => {
   return new Promise((resolve, reject) => {
       db.logs.find({}).sort({createdAt: 1}).exec((err, documents) => {
           if(err) reject(err)
           resolve(documents);
       });
   })
}