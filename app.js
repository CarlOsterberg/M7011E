
//https://github.com/rsp/node-static-http-servers/blob/master/express.js
var path = require('path');
let ejs = require('ejs');
var express = require('express');
var session = require('express-session');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
const MongoClient = require("mongodb");
const bcrypt = require("bcrypt");
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

const url = 'mongodb://127.0.0.1:27017'
const dbName = 'M7011E'

app.get('/', (req, res) => {
    return res.redirect('/home');
});

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
    res.render('login', {});
});

app.get('/logged_in', (req, res) => {
    res.render('logged_in', {});
});
app.get('/logout', (req, res) => {
    req.session.destroy();
    ssn = "Not set";
    return res.redirect('/home');
});
app.get('/createUser', (req, res) => {
    res.render('createUser', {});
});
/**
app.post('/createUser',function(req,res) {
    if (ssn === "Not set") {
        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
            if (err) return console.log(err)
            let db = client.db(dbName)
            let query = {name: req.body.createUser}

    }else{
        return res.redirect('/logged_in');
    }
});
*/
app.post('/login',function(req,res) {
    if (ssn === "Not set") {
        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
            if (err) return console.log(err)
            let db = client.db(dbName)
            let query = {username: req.body.login}
            db.collection("users").find(query).toArray(function (err, result) {
                if (err) return console.log(err)
                client.close();
                if (result.length<1) {
                    return res.end("User not found.");
                }
                bcrypt.compare(req.body.password, result[0].password).then(function (result) {
                    if (result) {
                        ssn = req.session;
                        ssn.user = req.body.login;
                        return res.redirect('/home');
                    }
                    else {
                        console.log("Failed attempt")
                        return res.redirect('/home');
                    }
                });
            });
        });
    }
    else{
        return res.redirect('/logged_in');
    }
});

app.listen(3000, function () {
    console.log('Listening on http://localhost:3000/home');
});