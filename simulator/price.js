module.exports = class Price {
    constructor(consumption, production) {
        this.setPrice(consumption, production);
    }

    setPrice(consumption, production) {
        //avg price = 2.15 kr / (kW/h)
        this.demandPrice = (consumption - production) / 25;
    }

    //avg demand / 25 = recommended price
}
