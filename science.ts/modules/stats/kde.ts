// http://exploringdata.net/den_trac.htm
namespace science.stats {

    export class kdeFunction {

        private m_kernel = science.stats.kernel.gaussian;
        private m_sample = [];
        private m_bandwidth = science.stats.bandwidth.nrd;

        kde(points: number[], i: number): number[][] {
            let bw = this.m_bandwidth.call(this, this.m_sample);
            let vm = this;

            return points.map(function (x) {
                var i = -1,
                    y = 0,
                    n = vm.m_sample.length;
                while (++i < n) {
                    y += vm.m_kernel((x - vm.m_sample[i]) / bw);
                }
                return [x, y / bw / n];
            });
        }

        kernel(x) {
            if (!arguments.length) return kernel;
            this.m_kernel = x;
            return this;
        };

        sample(x) {
            if (!arguments.length) return this.m_sample;
            this.m_sample = x;
            return this;
        };

        bandwidth(x) {
            if (!arguments.length) return this.m_bandwidth;
            this.m_bandwidth = science.functor(x);
            return this;
        };
    }
}