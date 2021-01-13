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
        wph(numUsers: Int!): Float!
        production: Float!
        demand: [Float!]!
    }
`);

// The root provides a resolver function for each API endpoint
const Query = {
    wph: ({numUsers}) => {
        currentdate = new Date();
        currentHour = currentdate.getSeconds();
        currentDay = currentdate.getMinutes();
        //new day
        if (currentDay!==latestDay) {
            simulator.windObj.generateAvgWindDay();
            simulator.windObj.generateAvgWindHour();
            simulator.consumptionObj.generateMultipleHouses(numUsers)
            latestDay = currentDay;
            latestHour = currentHour;
            simulator.productionObj.generateAvgProduction(simulator.windObj.avgWindHour);
        }
        //new hour
        else if (currentHour>latestHour+10) {
            simulator.windObj.generateAvgWindHour();
            simulator.consumptionObj.generateMultipleHouses(numUsers);
            latestHour = currentHour;
            simulator.productionObj.generateAvgProduction(simulator.windObj.avgWindHour);
        }
        return simulator.windObj.avgWindHour;
    },
    demand: () => {
        return simulator.consumptionObj.consumptions;
    },
    production: () => {
        return simulator.productionObj.prod;
    },
    price: () => {
        simulator.priceObj.setPrice(simulator.consumptionObj.consumption_avg,
            simulator.productionObj.numProsumers/simulator.consumptionObj.numUsers)
        return simulator.priceObj.demandPrice
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