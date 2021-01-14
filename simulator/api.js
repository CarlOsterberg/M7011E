const express = require('express');
const {graphqlHTTP} = require('express-graphql');
const {buildSchema} = require('graphql');
const s = require("./sim");
let simulator = new s();
let currentdate = new Date();
let latestHour = currentdate.getSeconds();
let latestDay = currentdate.getMinutes();

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
    type Query {
        price: Float!
        wph: Float!
        wpd: Float!
        production: Float!
        demand(numUsers: Int!): [Float!]!
    }
`);

// The root provides a resolver function for each API endpoint
const Query = {
    wph: () => {
        currentdate = new Date();
        currentHour = currentdate.getSeconds();
        currentDay = currentdate.getMinutes();
        if (currentDay !== latestDay) {
            simulator.windObj.generateAvgWindDay();
            simulator.windObj.generateAvgWindHour();
            latestDay = currentDay;
            latestHour = currentHour;
            simulator.productionObj.generateAvgProduction(simulator.windObj.avgWindHour);
        } else if (currentHour > latestHour + 10) {
            simulator.windObj.generateAvgWindHour();
            latestHour = currentHour;
            simulator.productionObj.generateAvgProduction(simulator.windObj.avgWindHour);
        }
        return simulator.windObj.avgWindHour;
    },
    wpd: () => simulator.windObj.avgWindDay,
    demand: ({numUsers}) => {
        return simulator.consumptionObj.generateMultipleHouses(numUsers)
    },
    production: () => {
        return simulator.productionObj.prod;
    },
    price: () => {
        simulator.priceObj.setPrice(simulator.consumptionObj.consumption_all)
        return simulator.priceObj.currentPrice
    },
}

var app = express();
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: Query,
    graphiql: true,
}));
app.listen(8080);
console.log('Running a GraphQL API server at http://localhost:8080/graphql');