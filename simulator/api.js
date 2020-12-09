const express = require('express');
const {graphqlHTTP} = require('express-graphql');
const {buildSchema} = require('graphql');
const s = require("./sim");

let simulator = new s();

// Construct a schema, using GraphQL schema language



const schema = buildSchema(`
    type Query {
        price: Float!
        wph: Float!
        wpd: Float!
        demand: Float!
        production: Float!
    }
`);

// The root provides a resolver function for each API endpoint
const Query = {
    price: () => simulator.priceObj.currentPrice,
    wph: () => simulator.windObj.avgWindHour,
    wpd: () => simulator.windObj.avgWindDay,
    demand: () => simulator.consumptionObj.consumption,
    production: () => simulator.productionObj.prod,
}

var app = express();
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: Query,
    graphiql: true,
}));
app.listen(4000);
console.log('Running a GraphQL API server at http://localhost:4000/graphql');