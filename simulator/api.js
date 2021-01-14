const express = require('express');
const {graphqlHTTP} = require('express-graphql');
const {buildSchema} = require('graphql');
const s = require("./sim");

let simulator = new s();

let Hours = 0;

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
        Hours++
        //new day
        if (Hours == 6) {
            simulator.windObj.generateAvgWindDay();
            simulator.windObj.generateAvgWindHour();
            simulator.consumptionObj.generateMultipleHouses(numUsers)
            Hours = 0
            simulator.productionObj.generateAvgProduction(simulator.windObj.avgWindHour);
        }
        //new hour
        else {
            simulator.windObj.generateAvgWindHour();
            simulator.consumptionObj.generateMultipleHouses(numUsers);
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
            simulator.productionObj.numProsumers / simulator.consumptionObj.numUsers)
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