const Promise = require('bluebird');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const config  = require('./etc/config.js')

var redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
const client = redis.createClient(process.env.REDIS_URL);

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};

app.use(allowCrossDomain);
app.use(bodyParser.urlencoded({extended: false}));

require('./controllers/slash.js')(app, config, client);
var server = http.createServer(app);
server.listen(8080);
