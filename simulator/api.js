var express = require('express');
var { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');
const s = require("./sim");

let simulator = new s();

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  type Query {
    price: Float
    wph: Float
    wpd: Float
    demand: Float
    production: Float
    update_day: Boolean
    update_hour: Boolean
  }
`);

// The root provides a resolver function for each API endpoint
var root = {
    price: () => {
        return simulator.priceObj.currentPrice;
    },
    wph: () => {
        return simulator.windObj.avgWindHour;
    },
    wpd: () => {
        return simulator.windObj.avgWindDay;
    },
    demand: () => {
        return simulator.consumptionObj.consumption;
    },
    production: () => {
        return simulator.productionObj.prod;
    },
    update_hour: () => {
        simulator.updateHour();
        return true;
    },
    update_day: () => {
        simulator.updateDay();
        return true;
    },
};

var app = express();
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));
app.listen(4000);
console.log('Running a GraphQL API server at http://localhost:4000/graphql');