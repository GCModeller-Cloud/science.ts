// Based on org.apache.commons.math.analysis.interpolation.LoessInterpolator
// from http://commons.apache.org/math/
namespace science.stats {

    export class loess {

        private m_bandwidth = .3;
        private m_robustnessIters = 2;
        private m_accuracy = 1e-12;

        smooth(xval, yval, weights) {
            var n = xval.length;
            var i;
            var w: number;

            if (n !== yval.length) throw { error: "Mismatched array lengths" };
            if (n == 0) throw { error: "At least one point required." };

            if (arguments.length < 3) {
                weights = [];
                i = -1; while (++i < n) weights[i] = 1;
            }

            loess.loessFiniteReal(xval);
            loess.loessFiniteReal(yval);
            loess.loessFiniteReal(weights);
            loess.StrictlyIncreasing(xval);

            if (n == 1) return [yval[0]];
            if (n == 2) return [yval[0], yval[1]];

            var bandwidthInPoints = Math.floor(this.m_bandwidth * n);

            if (bandwidthInPoints < 2) throw { error: "Bandwidth too small." };

            var res = [],
                residuals = [],
                robustnessWeights = [];

            // Do an initial fit and 'robustnessIters' robustness iterations.
            // This is equivalent to doing 'robustnessIters+1' robustness iterations
            // starting with all robustness weights set to 1.
            i = -1; while (++i < n) {
                res[i] = 0;
                residuals[i] = 0;
                robustnessWeights[i] = 1;
            }

            var iter = -1;
            while (++iter <= this.m_robustnessIters) {
                var bandwidthInterval = [0, bandwidthInPoints - 1];
                // At each x, compute a local weighted linear regression
                var x;
                i = -1; while (++i < n) {
                    x = xval[i];

                    // Find out the interval of source points on which
                    // a regression is to be made.
                    if (i > 0) {
                        loess.UpdateBandwidthInterval(xval, weights, i, bandwidthInterval);
                    }

                    var ileft = bandwidthInterval[0],
                        iright = bandwidthInterval[1];

                    // Compute the point of the bandwidth interval that is
                    // farthest from x
                    var edge = (xval[i] - xval[ileft]) > (xval[iright] - xval[i]) ? ileft : iright;

                    // Compute a least-squares linear fit weighted by
                    // the product of robustness weights and the tricube
                    // weight function.
                    // See http://en.wikipedia.org/wiki/Linear_regression
                    // (section "Univariate linear case")
                    // and http://en.wikipedia.org/wiki/Weighted_least_squares
                    // (section "Weighted least squares")
                    var sumWeights = 0,
                        sumX = 0,
                        sumXSquared = 0,
                        sumY = 0,
                        sumXY = 0,
                        denom = Math.abs(1 / (xval[edge] - x));

                    for (var k = ileft; k <= iright; ++k) {
                        var xk = xval[k],
                            yk = yval[k],
                            dist = k < i ? x - xk : xk - x,
                            w = loess.Tricube(dist * denom) * robustnessWeights[k] * weights[k],
                            xkw = xk * w;
                        sumWeights += w;
                        sumX += xkw;
                        sumXSquared += xk * xkw;
                        sumY += yk * w;
                        sumXY += yk * xkw;
                    }

                    var meanX = sumX / sumWeights,
                        meanY = sumY / sumWeights,
                        meanXY = sumXY / sumWeights,
                        meanXSquared = sumXSquared / sumWeights;

                    var beta = (Math.sqrt(Math.abs(meanXSquared - meanX * meanX)) < this.m_accuracy)
                        ? 0 : ((meanXY - meanX * meanY) / (meanXSquared - meanX * meanX));

                    var alpha = meanY - beta * meanX;

                    res[i] = beta * x + alpha;
                    residuals[i] = Math.abs(yval[i] - res[i]);
                }

                // No need to recompute the robustness weights at the last
                // iteration, they won't be needed anymore
                if (iter === this.m_robustnessIters) {
                    break;
                }

                // Recompute the robustness weights.

                // Find the median residual.
                var medianResidual = science.stats.median(residuals);

                if (Math.abs(medianResidual) < this.m_accuracy)
                    break;

                var arg;

                i = -1; while (++i < n) {
                    arg = residuals[i] / (6 * medianResidual);
                    robustnessWeights[i] = (arg >= 1) ? 0 : ((w = 1 - arg * arg) * w);
                }
            }

            return res;
        }

        bandwidth(x) {
            if (!arguments.length) return x;
            this.m_bandwidth = x;
            return this;
        };

        robustnessIterations(x) {
            if (!arguments.length) return x;
            this.m_robustnessIters = x;
            return this;
        };

        accuracy(x) {
            if (!arguments.length) return x;
            this.m_accuracy = x;
            return this;
        };

        static FiniteReal(values) {
            var n = values.length,
                i = -1;

            while (++i < n) if (!isFinite(values[i])) return false;

            return true;
        }

        static StrictlyIncreasing(xval) {
            var n = xval.length,
                i = 0;

            while (++i < n) if (xval[i - 1] >= xval[i]) return false;

            return true;
        }

        // Compute the tricube weight function.
        // http://en.wikipedia.org/wiki/Local_regression#Weight_function
        static Tricube(x) {
            return (x = 1 - x * x * x) * x * x;
        }

        // Given an index interval into xval that embraces a certain number of
        // points closest to xval[i-1], update the interval so that it embraces
        // the same number of points closest to xval[i], ignoring zero weights.
        static UpdateBandwidthInterval(
            xval, weights, i, bandwidthInterval) {

            var left = bandwidthInterval[0],
                right = bandwidthInterval[1];

            // The right edge should be adjusted if the next point to the right
            // is closer to xval[i] than the leftmost point of the current interval
            var nextRight = loess.NextNonzero(weights, right);
            if ((nextRight < xval.length) && (xval[nextRight] - xval[i]) < (xval[i] - xval[left])) {
                var nextLeft = loess.NextNonzero(weights, left);
                bandwidthInterval[0] = nextLeft;
                bandwidthInterval[1] = nextRight;
            }
        }

        static NextNonzero(weights, i) {
            var j = i + 1;
            while (j < weights.length && weights[j] === 0) j++;
            return j;
        }
    }


};
