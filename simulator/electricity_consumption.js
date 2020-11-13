const generate = require("./sample_gaussian_distr");
const w = require("./wind");

class Consumption {
    max;
    min;
    consumption;
    production;
    wind;
    //avg_consumption 55 kWh
    constructor() {
        this.max = 110;
        this.min = 0;
        this.wind = new w();
        this.wind.generateAvgWindDay();
    }
    generateAvgConsumption() {
        this.consumption = generate.nrml_distr_val(this.min,this.max);
    }
    generateAvgProduction() {
        this.wind.generateAvgWindHour();
        if (this.wind.avgWindHour<3) {
            this.production = 0;
        }
        else {
            //when wind = 7.5 m/s, production = 55 kWh (Both averages).
            this.production = this.wind.avgWindHour * (55/7.5);
        }
    }
}

