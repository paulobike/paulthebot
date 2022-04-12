const env        = require('./env')();
console.log(env);
const IP         = process.env.IP;
const PORT       = process.env.PORT;

const http       = require('http');
const express    = require('express');
const jwt        = require('jsonwebtoken');
const bot        = require('./bot');
const db         = require('./dataStore');
const middleware = require('./middleware');
const { getLogs, log, emitLogs } = require('./logger');
const app        = express();
const { Server }         = require('socket.io');

app.use(function (req, res, next) {

  res.setHeader('Access-Control-Allow-Origin', '*');

  res.setHeader('Access-Control-Allow-Methods', '*');

  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Accept,X-Auth-token,X-Username');

  res.setHeader('Access-Control-Allow-Credentials', true);

  next();
});
app.use(express.json({}))

app.post('/api/login', (req, res, next) => {
  let username = req.body.username.toLowerCase();
  let password = req.body.password;
  console.log(req.body)

  db.admin.findOne({ username, password }, (err, user) => {
    if(user && user.username == username && user.password == password) {
      const metadata = {
        id: user._id,
      }
      const token = jwt.sign(metadata, process.env.JWT_SECRET, {expiresIn: '1d'});
      return res.json({
        token,
        status: 200
      });
    }
    let loginErr = new Error('Invalid credentials');
    loginErr.status = 401;
    next(loginErr);
  })
});

app.get('/api/details', middleware.isLoggedIn, (req, res, next) => {  
  var date = new Date();
  var today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  today = today.getTime()
  db.trades.find({date: {$gte: today}}, (err, docs) => {
    if(err) return next(new Error('Something went wrong'));
    res.json({
      trades: docs,
      alive: bot.getIsRunning(),
      status: 200
    });
  });
})

app.put('/api/password', middleware.isLoggedIn, (req, res, next) => {
  let password = req.body.password;
  let oldPassword = req.body.oldPassword;
  let username = req.user.username;
  db.admin.update({username, password: oldPassword}, { username, password }, (err, doc) => {
    if(err) return next(new Error('Something went wrong'));
    if(!doc) {
      let error = new Error('Old password incorrect');
      error.status = 400;
      return next(error);
    }
    res.json({message: 'Ok', status: 200})
  });
});

app.get('/api/options', middleware.isLoggedIn, (req, res, next) => {  
  db.options.find({}, (err, docs) => {
    if(err) return next(new Error('Something went wrong'));
    res.json({
      options: docs,
      status: 200
    });
  });
})

app.put('/api/options', middleware.isLoggedIn, (req, res, next) => {
  let name = req.body.name;
  let value = req.body.value;
  db.options.update({name}, { name, value }, (err, doc) => {
    if(err) return next(new Error('Something went wrong'));
    res.json({message: 'Ok', status: 200})
  });
});

app.get('/api/toggle', middleware.isLoggedIn, async (req, res, next) => {
  console.log('running command')
  log('RUNNING COMMAND...');
  try {
    if(!bot.getIsRunning()) await bot.init();
    else bot.sleep();
    res.json({message :'OK', status: 200});
  } catch (err) {
    next(new Error(err));
  }
  
});

app.get('/api/pairs', middleware.isLoggedIn, (req, res, next) => {
  db.pairs.find({}, (err, docs) => {
    if(err) return next(new Error('Something went wrong'));
    res.json({
      pairs: docs,
      status: 200
    });
  });
});

app.post('/api/pairs', middleware.isLoggedIn, (req, res, next) => {
  let symbol = req.body.symbol;
  if(!symbol || typeof symbol != 'string') {
    return next(new Error('Please enter a valid symbol'));
  }
  symbol = symbol.toUpperCase();
  db.pairs.findOne({symbol}, (err, pair) => {
    if(pair) return next(new Error('Symbol already exists'));
    db.pairs.insert({symbol, inTrade: false}, (err, docs) => {
      if(err) return next(new Error('Something went wrong'));
      res.json({
        message: 'ok',
        status: 200
      });
    });
  })
  
});

app.delete('/api/pairs/:id', middleware.isLoggedIn, (req, res, next) => {
  db.pairs.remove({_id: req.params.id}, (err, docs) => {
    if(err) return next(new Error('Something went wrong'));
    res.json({
      message: 'ok',
      status: 200
    });
  });
});

app.get('/api/logs', middleware.isLoggedIn, async(req, res, next) => {
  try {
    let logs = await getLogs();
    res.json({
      logs,
      status: 200
    });
  } catch(err) {
    console.log(err)
    next(new Error('Something went wrong'));
  }
});

app.use((error, req, res, next) => {
  console.log(error)
  if(!error.status || error.status == 500) {
    return res.status(500).json({
      message: error.message,
      status: 500
    });
  }
  res.json({
      message: error.message,
      status: error.status
  });
});

app.use(express.static('public'))
app.use('*', express.static('public'))

const server  = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.of('/logs').on("connection", (socket) => {
  console.log(socket.id);
  emitLogs(socket);
});

server.listen(PORT, IP, () => {
  console.log(`bot listening at http://${IP}:${PORT}`);
});