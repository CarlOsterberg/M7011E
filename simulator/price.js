module.exports = class Price {
    constructor(consumption, wph) {
        this.windFactor = 0.2;
        this.consumptionFactor = 0.04;
        this.setPrice(consumption, wph);
    }
    setPrice(consumption, wph) {
        //avg price = 2.15 kr / (kW/h)
        this.generateWindPrice(wph);
        this.generateDemandPrice(consumption);
        this.currentPrice = this.demandPrice + this.windPrice;
    }
    generateDemandPrice(consumption) {
        this.demandPrice = consumption * this.consumptionFactor;
    }
    generateWindPrice(wph) {
        this.windPrice = (7.5 - wph) * this.windFactor;
    }
}
