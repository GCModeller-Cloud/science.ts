namespace science.stats.distribution {

    // From http://www.colingodsey.com/javascript-gaussian-random-number-generator/
    // Uses the Box-Muller Transform.
    export class gaussianFunction {

        private m_random = Math.random;
        private m_mean = 0;
        private m_sigma = 1;
        private m_variance = 1;

        gaussian() {
            var x1,
                x2,
                rad,
                y1;

            do {
                x1 = 2 * this.m_random() - 1;
                x2 = 2 * this.m_random() - 1;
                rad = x1 * x1 + x2 * x2;
            } while (rad >= 1 || rad === 0);

            return this.m_mean + this.m_sigma * x1 * Math.sqrt(-2 * Math.log(rad) / rad);
        }

        pdf(x) {
            x = (x - this.m_mean) / this.m_sigma;
            return gaussianConstant * Math.exp(-.5 * x * x) / this.m_sigma;
        };

        cdf(x) {
            x = (x - this.m_mean) / this.m_sigma;
            return .5 * (1 + science.stats.erf(x / Math.SQRT2));
        };

        mean(x) {
            if (!arguments.length) return this.m_mean;
            this.m_mean = +x;
            return this;
        };

        variance(x) {
            if (!arguments.length) return this.m_variance;
            this.m_sigma = Math.sqrt(this.m_variance = +x);
            return this;
        };

        random(x) {
            if (!arguments.length) return this.m_random;
            this.m_random = x;
            return this;
        };
    };
};