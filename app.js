
//https://github.com/rsp/node-static-http-servers/blob/master/express.js
var path = require('path');
let ejs = require('ejs');
var express = require('express');
var session = require('express-session');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
    secret: 'wewo',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}))

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));

var ssn = "Not set";

app.get('/home', (req, res) => {
    if (ssn === "Not set") {
        res.render('home', {ssn: "Login"});
    }
    else {
        res.render('home', {ssn: ssn.user});
    }
});

app.get('/personal', (req, res) => {
    if (ssn === "Not set") {
        res.render('personal', {ssn: "Login"});
    }
    else {
        res.render('personal', {ssn: ssn.user});
    }
});

app.get('/settings', (req, res) => {
    if (ssn === "Not set") {
        res.render('settings', {ssn: "Login"});
    }
    else {
        res.render('settings', {ssn: ssn.user});
    }
});

app.get('/login', (req, res) => {
    if (ssn === "Not set") {
        res.render('login', {ssn: "Login"});
    }
    else {
        res.render('login', {ssn: ssn.user});
    }
});

app.post('/login',function(req,res) {
    if (ssn === "Not set") {
        ssn = req.session;
        ssn.user = req.body.login;
        ssn.password = req.body.password;
        return res.redirect('/home');
    }
    else{
        console.log(ssn.user);
        return res.redirect('/home');
    }
});

app.listen(3000, function () {
    console.log('Listening on http://localhost:3000/home');
});