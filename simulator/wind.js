class Wind {
    max;
    min;
    avgWindDay;
    avgWindHour;
    constructor() {
        this.min = 15;
        this.max = 0;
    }
    //https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
    randn_bm(min, max) {
        var u = 0, v = 0;
        while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );

        num = num / 10.0 + 0.5; // Translate to 0 -> 1
        if (num > 1 || num < 0) num = randn_bm(min, max); // resample between 0 and 1 if out of range
        num *= max - min; // Stretch to fill range
        num += min; // offset to min
        return num;
    }
    generateAvgWindDay() {
        this.avgWindDay = this.randn_bm(this.min,this.max);
    }

    generateAvgWindHour() {
        if (this.avgWindDay - 4 < 0) {
            this.avgWindHour = this.randn_bm(0, this.avgWindDay + 4);
        }
        else {
            this.avgWindHour = this.randn_bm(this.avgWindDay - 4, this.avgWindDay + 4);
        }
    }
}

let wind = new Wind();
wind.generateAvgWindDay();
wind.generateAvgWindHour();
console.log(wind.avgWindDay);
console.log(wind.avgWindHour);

