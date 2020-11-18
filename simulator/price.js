const consumption = require("./electricity_consumption");

class Price {
    demandPrice;
    windPrice;
    windFactor;
    consumptionFactor;
    c;
    constructor() {
        this.c = new consumption();
        this.windFactor = 0.2;
        this.consumptionFactor = 0.04;
    }
    price() {
        //avg price = 2.15 kr / (kW/h)
        return this.demandPrice + this.windPrice;
    }
    generateDemandPrice() {
        this.c.generateAvgConsumption();
        this.demandPrice = this.c.consumption * this.consumptionFactor;
    }
    generateWindPrice() {
        this.windPrice = (7.5 - this.c.wind.avgWindHour) * this.windFactor;
    }
}
