//https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
module.exports = {
    nrml_distr_val: function (min, max) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

        num = num / 10.0 + 0.5; // Translate to 0 -> 1
        if (num > 1 || num < 0) num = nrml_distr_val(min, max); // resample between 0 and 1 if out of range
        num *= max - min; // Stretch to fill range
        num += min; // offset to min
        return num;
    }
}