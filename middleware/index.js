const db = require('../dataStore');
const middleware = {};
const jwt = require('jsonwebtoken');

middleware.isLoggedIn = (req, res, next) => {
    return next();
    const loginErr = new Error('You need to be logged in');
    loginErr.status = 401;
    const token = req.get('X-Auth-Token');
    console.log(typeof token)
    if(!token || token == 'null') return next(loginErr);
    try {
        const metadata = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = metadata.id;   
        db.admin.findOne({ _id: user_id}, (err, user) => {
            if(err) return next(err);
            if(user) {
                req.user = user;
                next();
            } else next(loginErr);
        })
    } catch(err) {
        console.log(err);
        next(loginErr);
    }
    
};

module.exports = middleware;