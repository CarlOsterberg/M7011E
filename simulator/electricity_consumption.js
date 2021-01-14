const generate = require("./sample_distr");

module.exports = class Consumption {
    //avg_consumption for a day is 55 kWh
    constructor() {
        this.max = 110;
        this.min = 0;
        this.generateAvgConsumption();
    }

    generateAvgConsumption() {
        this.consumption = generate.nrml_distr_val(this.min, this.max);
    }

    generateMultipleHouses(numUsers) {
        let vals = []
        let sum = 0
        for (let i = 0; i < numUsers; i++) {
            this.generateAvgConsumption();
            vals.push(this.consumption);
            sum += this.consumption
        }
        this.consumption_all = sum
        return vals
    }
}

