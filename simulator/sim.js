const p = require("./price");
const pr = require("./electricity_production");
const w = require("./wind");
const c = require("./electricity_consumption");

module.exports = class Sim {
    priceObj;
    windObj;
    consumptionObj;
    productionObj;
    constructor() {
        this.windObj = new w();
        this.consumptionObj = new c();
        this.productionObj = new pr(this.windObj.avgWindHour);
        this.priceObj = new p(this.consumptionObj.consumption, this.windObj.avgWindHour);
    }
    updateHour() {
        this.windObj.generateAvgWindHour();
        this.productionObj.generateAvgProduction(this.windObj.avgWindHour);
        this.priceObj.setPrice(this.consumptionObj.consumption, this.windObj.avgWindHour);
    }
    updateDay() {
        this.windObj.generateAvgWindDay();
        this.consumptionObj.generateAvgConsumption();
        this.updateHour();
    }
}