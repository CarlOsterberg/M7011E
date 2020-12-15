
//https://github.com/rsp/node-static-http-servers/blob/master/express.js
var path = require('path');
let ejs = require('ejs');
var express = require('express');
var session = require('express-session');
var redis   = require("redis");
var redisStore = require('connect-redis')(session);
var redisClient  = redis.createClient();
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
const MongoClient = require("mongodb");
const bcrypt = require("bcrypt");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
    secret: 'wewo',
    // create new redis store.
    store: new redisStore({ host: 'localhost', port: 6379, client: redisClient,ttl :  260}),
    saveUninitialized: true,
    resave: false
}));

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));

const url = 'mongodb://127.0.0.1:27017'
const dbName = 'M7011E'

app.get('/', (req, res) => {
    if (req.session.user) {
        res.render('home', {ssn: req.session.user});
    }
    else {
        res.render('home',{ssn: "Login"});
    }
});

app.get('/home', (req, res) => {
    if (req.session.user) {
        res.render('home', {ssn: req.session.user});
    }
    else {
        res.render('home',{ssn: "Login"});
    }
});

app.get('/personal', (req, res) => {
    if (req.session.user) {
        res.render('personal', {ssn: req.session.user, username: req.session.user,
            name: req.session.name, email: req.session.email,
            prosumer: req.session.prosumer, consumer: req.session.consumer,
            manager: req.session.manager, admin: req.session.admin});
    }
    else {
        res.render('personal',{ssn: "Login"});
    }
});

app.get('/settings', (req, res) => {
    if (req.session.user) {
        res.render('settings', {ssn: req.session.user});
    }
    else {
        res.render('settings',{ssn: "Login"});
    }
});

app.get('/login', (req, res) => {
    res.render('login', {});
});

app.get('/logged_in', (req, res) => {
    res.render('logged_in', {});
});
app.get('/logout', (req, res) => {
    req.session.destroy(function(err){
        if(err){
            console.log(err);
        } else {
            return res.redirect('/home');
        }
    });
});
app.get('/createUser', (req, res) => {
    res.render('createUser', {});
});
app.get('/user_created', (req, res) => {
    res.render('user_created', {});
});
app.get('/user_exists', (req, res) => {
    res.render('user_exists', {});
});
app.get('/login_error', (req, res) => {
    res.render('login_error', {});
});

app.post('/createUser',function(req,res) {
    if (!req.session.user) {
        let consumer = 0
        let manager = 0
        let prosumer = 0
        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
            if (err) return console.log(err)
            let db = client.db(dbName)
            let query = { username: req.body.username }
            db.collection("users").find(query).toArray(function (err, result) {
                if (err) return console.log(err)
                if(!result.length) {
                    bcrypt.genSalt(10, function (err, salt) {
                        bcrypt.hash(req.body.password, salt, function (err, hash) {
                            if(req.body.role === "Consumer") {
                                consumer = 1
                                manager = 0
                                prosumer = 0
                            } else if (req.body.role === "Prosumer") {
                                consumer = 0
                                manager = 0
                                prosumer = 1
                            } else {
                                consumer = 0
                                manager = 1
                                prosumer = 0
                            }
                            let user = { name: req.body.name,
                                username: req.body.username,
                                password: hash,
                                email: req.body.email,
                                manager: manager,
                                prosumer: prosumer,
                                consumer: consumer,
                                admin: 0
                            };
                            db.collection("users").insertOne(user,function (err, result) {
                                if(err){
                                    return console.log(err)
                                } else {
                                    return res.redirect('/user_created');
                                }
                            });
                        });
                    });
                } else {
                    /*return res.end("User already exists");*/
                    return res.redirect('/user_exists');
                }
            });
        });
    } else {
        return res.redirect('/logged_in');
    }
});


app.post('/login',function(req,res) {
    if (req.session.user) {
        return res.redirect('/logged_in');
    }
    else{

        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
            if (err) return console.log(err)
            let db = client.db(dbName)
            let query = {username: req.body.login}
            db.collection("users").find(query).toArray(function (err, result) {
                if (err) return console.log(err)
                client.close();
                if (result.length<1) {
                    return res.redirect('/login_error');
                }
                bcrypt.compare(req.body.password, result[0].password).then(function (result2) {
                    if (result2) {
                        console.log(result)
                        req.session.user = req.body.login;
                        req.session.email = result[0].email;
                        req.session.name = result[0].name;
                        req.session.prosumer = result[0].prosumer;
                        req.session.consumer = result[0].consumer;
                        req.session.manager = result[0].manager;
                        req.session.admin = result[0].admin;

                        return res.redirect('/home');
                    }
                    else {
                        return res.redirect('/login_error');
                    }
                });
            });
        });
    }
});

app.listen(3000, function () {
    console.log('Listening on http://localhost:3000/home');
});