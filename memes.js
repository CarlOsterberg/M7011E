var path = require('path');
var http = require('http');
var fs = require('fs');

var dir = path.join(__dirname, 'clients');

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

var server = http.createServer((req, res) => {
    var r = req.url.toString().split('?');
    var reqpath = r[0];
    if (req.method !== 'GET') {
        console.log(req);
    }
    var file = path.join(dir, reqpath.replace(/\/$/, '/home.html'));
    if (file.indexOf(dir + path.sep) !== 0) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain');
        return res.end('Forbidden');
    }
    var type = mime[path.extname(file).slice(1)] || 'text/plain';
    var s = fs.createReadStream(file);
    s.on('open', () => {
        res.setHeader('Content-Type', type);
        s.pipe(res);
    });
    s.on('error', () => {
        res.setHeader('Content-Type', 'text/plain');
        res.statusCode = 404;
        res.end('Not found');
    });
});

server.listen(3000, () => console.log('Listening on http://localhost:3000/'));