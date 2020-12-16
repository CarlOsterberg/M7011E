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
        production: Float!
        demand(numUsers: Int!): [Float!]!
    }
`);

// The root provides a resolver function for each API endpoint
const Query = {
    price: () => simulator.priceObj.currentPrice,
    wph: () => simulator.windObj.avgWindHour,
    wpd: () => simulator.windObj.avgWindDay,
    demand: ({numUsers}) => {
        let vals = [];
        for (let i = 0;i<numUsers;i++){
            simulator.consumptionObj.generateAvgConsumption();
            vals.push(simulator.consumptionObj.consumption);
        }
        return vals;
    },
    production: () => simulator.productionObj.prod,
}

var app = express();
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: Query,
    graphiql: false,
}));
app.listen(8080);
console.log('Running a GraphQL API server at http://localhost:8080/graphql');