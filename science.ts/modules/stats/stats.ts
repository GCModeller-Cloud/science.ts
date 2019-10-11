namespace science.stats {

    // Based on implementation in http://picomath.org/.
    export function erf(x) {
        var a1 = 0.254829592,
            a2 = -0.284496736,
            a3 = 1.421413741,
            a4 = -1.453152027,
            a5 = 1.061405429,
            p = 0.3275911;

        // Save the sign of x
        var sign = x < 0 ? -1 : 1;
        if (x < 0) {
            sign = -1;
            x = -x;
        }

        // A&S formula 7.1.26
        var t = 1 / (1 + p * x);
        return sign * (
            1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1)
            * t * Math.exp(-x * x));
    };

    export function phi(x) {
        return .5 * (1 + science.stats.erf(x / Math.SQRT2));
    };

    export function iqr(x) {
        var quartiles = science.stats.quantiles(x, [.25, .75]);
        return quartiles[1] - quartiles[0];
    };

    // Welford's algorithm.
   export function mean  (x) {
        var n = x.length;
        if (n === 0) return NaN;
        var m = 0,
            i = -1;
        while (++i < n) m += (x[i] - m) / (i + 1);
        return m;
    };
   export function median  (x) {
        return science.stats.quantiles(x, [.5])[0];
    };
   export function mode  (x) {
        var counts = {},
            mode = [],
            max = 0,
            n = x.length,
            i = -1,
            d,
            k;
        while (++i < n) {
            k = counts.hasOwnProperty(d = x[i]) ? ++counts[d] : counts[d] = 1;
            if (k === max) mode.push(d);
            else if (k > max) {
                max = k;
                mode = [d];
            }
        }
        if (mode.length === 1) return mode[0];
    };
    // Uses R's quantile algorithm type=7.
  export function quantiles  (d, quantiles) {
        d = d.slice().sort(science.ascending);
        var n_1 = d.length - 1;
        return quantiles.map(function (q) {
            if (q === 0) return d[0];
            else if (q === 1) return d[n_1];

            var index = 1 + q * n_1,
                lo = Math.floor(index),
                h = index - lo,
                a = d[lo - 1];

            return h === 0 ? a : a + h * (d[lo] - a);
        });
    };
    // Unbiased estimate of a sample's variance.
    // Also known as the sample variance, where the denominator is n - 1.
  export function variance  (x) {
        var n = x.length;
        if (n < 1) return NaN;
        if (n === 1) return 0;
        var mean = science.stats.mean(x),
            i = -1,
            s = 0;
        while (++i < n) {
            var v = x[i] - mean;
            s += v * v;
        }
        return s / (n - 1);
    };
}