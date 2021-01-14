module.exports = class Production {
    //avg_consumption 55 kWh
    constructor(wph) {
        this.generateAvgProduction(wph);
    }

    generateAvgProduction(wph) {
        if (wph < 3) {
            this.prod = 0;
        } else {

            //when wind = 7.5 m/s, production = 55 kWh (Both averages).
            this.prod = wph * (55 / 7.5);
        }
    }
}

