
//https://github.com/rsp/node-static-http-servers/blob/master/express.js
var path = require('path');
var express = require('express');
var session = require('express-session');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({secret:'XASDASDA'}));

var ssn;

var dir = path.join(__dirname, '/clients');

var mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};
app.get('*', function (req, res) {
    var file = path.join(dir, req.path.replace(/\/$/, '/home.html'));
    if (file.indexOf(dir + path.sep) !== 0) {
        return res.status(403).end('Forbidden');
    }
    var type = mime[path.extname(file).slice(1)] || 'text/plain';
    var s = fs.createReadStream(file);
    s.on('open', function () {
        res.set('Content-Type', type);
        s.pipe(res);
    });
    s.on('error', function () {
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
    });
});

app.post('/login',function(req,res) {
    ssn = req.session;
    console.log(req.body.login);
    console.log(req.body.password);
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    return res.end('Forbidden');
    //return res.redirect('/home.html');
});

app.listen(3000, function () {
    console.log('Listening on http://localhost:3000/');
});