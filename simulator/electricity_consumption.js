const generate = require("./sample_distr");

module.exports = class Consumption {
    max;
    min;
    consumption;
    //avg_consumption for a day is 55 kWh
    constructor() {
        this.max = 110;
        this.min = 0;
        this.generateAvgConsumption();
    }

    generateAvgConsumption() {
        this.consumption = generate.nrml_distr_val(this.min,this.max);
    }
}

