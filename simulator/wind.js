const generate = require("./sample_distr");

module.exports = class Wind {
    max;
    min;
    avgWindDay;
    avgWindHour;
    constructor() {
        this.min = 15;
        this.max = 0;
    }
    generateAvgWindDay() {
        this.avgWindDay = generate.nrml_distr_val(this.min,this.max);
    }

    generateAvgWindHour() {
        if (this.avgWindDay - 4 < 0) {
            this.avgWindHour = generate.nrml_distr_val(0, this.avgWindDay + 4);
        }
        else {
            this.avgWindHour = generate.nrml_distr_val(this.avgWindDay - 4, this.avgWindDay + 4);
        }
    }
}

