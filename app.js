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
const app        = express();

app.use(function (req, res, next) {

  res.setHeader('Access-Control-Allow-Origin', '*');

  res.setHeader('Access-Control-Allow-Methods', '*');

  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Accept,X-Auth-token,X-Username');

  res.setHeader('Access-Control-Allow-Credentials', true);

  next();
});
app.use(express.json({}))

app.post('/login', (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;
  console.log(username, password)

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

app.get('/details', middleware.isLoggedIn, (req, res, next) => {  
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

app.put('/password', middleware.isLoggedIn, (req, res, next) => {
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

app.get('/options', middleware.isLoggedIn, (req, res, next) => {  
  db.options.find({}, (err, docs) => {
    if(err) return next(new Error('Something went wrong'));
    res.json({
      options: docs,
      status: 200
    });
  });
})

app.put('/options', middleware.isLoggedIn, (req, res, next) => {
  let name = req.body.name;
  let value = req.body.value;
  db.options.update({name}, { name, value }, (err, doc) => {
    if(err) return next(new Error('Something went wrong'));
    res.json({message: 'Ok', status: 200})
  });
});

app.get('/toggle', middleware.isLoggedIn, async (req, res, next) => {
  console.log('running command')
  if(!bot.getIsRunning()) await bot.init();
  else bot.sleep();
  res.json({message :'OK', status: 200});
});

app.use((error, req, res, next) => {
  console.log(error)
  res.json({
      message: error.message,
      status: error.status || 500
  });
});

app.use(express.static('public'))
app.use('*', express.static('public'))

const server  = http.createServer(app);

server.listen(PORT, IP, () => {
  console.log(`bot listening at http://${IP}:${PORT}`);
});