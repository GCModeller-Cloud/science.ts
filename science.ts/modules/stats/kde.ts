// http://exploringdata.net/den_trac.htm
namespace science.stats.kde {

    export interface Ikde {

        (points: number[], i: number): number[][];

        kernel(x): Ikde | any;
        sample(x): Ikde | any;
        bandwidth(x): Ikde | any;
    }

    function kdeImpl(): Ikde {
        var kernel = science.stats.kernel.gaussian,
            sample = [],
            bandwidth = science.stats.bandwidth.nrd;

        let kde: any = function (points: number[], i: number): number[][] {
            var bw = bandwidth.call(this, sample);

            return points.map(function (x) {
                var i = -1,
                    y = 0,
                    n = sample.length;
                while (++i < n) {
                    y += kernel((x - sample[i]) / bw);
                }
                return [x, y / bw / n];
            });
        }

        kde.kernel = function (x) {
            if (!arguments.length) return kernel;
            kernel = x;
            return kde;
        };

        kde.sample = function (x) {
            if (!arguments.length) return sample;
            sample = x;
            return kde;
        };

        kde.bandwidth = function (x) {
            if (!arguments.length) return bandwidth;
            bandwidth = science.functor(x);
            return kde;
        };

        return kde;
    }
}