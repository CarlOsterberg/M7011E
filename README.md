# M7011E

####Installation
Project currently runs on Node.js version 14.15.0, other versions 
of node may not be compatible. For the project to work you will need to 
install [Node.js](https://nodejs.org/en/) for the server.
We also use a database, [MongoDB](https://www.mongodb.com/), version used 4.4.2.
For authentication a [Redis](https://redis.io/) server is used to keep track of sessions.
<br/>
After these are installed, clone the repository and run
<br/>
```
npm install package.json
```
This will install all the needed node dependencies.

####Configuration
Now the database server address and redis store server address needs
needs to be added. In the top of app.js, at row 19 and 26, change the database url and 
port to your mongodb server address/port. In the session setup in app.js
change the store to where yours is hosted.
```javascript
const url = 'mongodb://your_mongodb_host:your_mongodb_port'
//----
app.use(session({
    secret: 'put_whatever_here',
    // create new redis store.
    store: new redisStore({host: 'your_redis_host', port: 'your_redis_port', client: redisClient, ttl: 260}),
    saveUninitialized: true,
    resave: false
}));
```
Now in graphQuery.js on row 4 change the url to your database server
 address. Also if you want to the graphql api can be hosted elsewhere then 
 locally, then also change host at row 7.
 
 ```javascript
const url = 'mongodb://your_mongodb_host:your_mongodb_port'
//---
let host = 'your_api_host'
 ```

Also the first time running the project add
```javascript
resetDbValues()
```
to graphQuery.js, this sets up a mongodb collection for you.

####Running

And finally we can run the actual program, so there are essentially 
five parts to the project, a mongodb database, a redis store, app.js
which holds all the http server routes, simulator/api.js which runs a 
graphql application (our api) and graphQuery.js which performs queries
on the api at a regular intervall.
<br><br>
Now run the following commands in the M7011E folder
```
node app.js
node simulator/api.js
node graphQuery.js
```
Its important that the api is upp and running before graphQuery.js is 
run. Otherwise graphQuery.js will crash.