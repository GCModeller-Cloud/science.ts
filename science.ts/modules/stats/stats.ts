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

    export function phi  (x) {
        return .5 * (1 + science.stats.erf(x / Math.SQRT2));
    };


    // Based on figue implementation by Jean-Yves Delort.
    // http://code.google.com/p/figue/
    science.stats.kmeans = function () {
        var distance = science.stats.distance.euclidean,
            maxIterations = 1000,
            k = 1;

        function kmeans(vectors) {
            var n = vectors.length,
                assignments = [],
                clusterSizes = [],
                repeat = 1,
                iterations = 0,
                centroids = science_stats_kmeansRandom(k, vectors),
                newCentroids,
                i,
                j,
                x,
                d,
                min,
                best;

            while (repeat && iterations < maxIterations) {
                // Assignment step.
                j = -1; while (++j < k) {
                    clusterSizes[j] = 0;
                }

                i = -1; while (++i < n) {
                    x = vectors[i];
                    min = Infinity;
                    j = -1; while (++j < k) {
                        d = distance.call(this, centroids[j], x);
                        if (d < min) {
                            min = d;
                            best = j;
                        }
                    }
                    clusterSizes[assignments[i] = best]++;
                }

                // Update centroids step.
                newCentroids = [];
                i = -1; while (++i < n) {
                    x = assignments[i];
                    d = newCentroids[x];
                    if (d == null) newCentroids[x] = vectors[i].slice();
                    else {
                        j = -1; while (++j < d.length) {
                            d[j] += vectors[i][j];
                        }
                    }
                }
                j = -1; while (++j < k) {
                    x = newCentroids[j];
                    d = 1 / clusterSizes[j];
                    i = -1; while (++i < x.length) x[i] *= d;
                }

                // Check convergence.
                repeat = 0;
                j = -1; while (++j < k) {
                    if (!science_stats_kmeansCompare(newCentroids[j], centroids[j])) {
                        repeat = 1;
                        break;
                    }
                }
                centroids = newCentroids;
                iterations++;
            }
            return { assignments: assignments, centroids: centroids };
        }

        kmeans.k = function (x) {
            if (!arguments.length) return k;
            k = x;
            return kmeans;
        };

        kmeans.distance = function (x) {
            if (!arguments.length) return distance;
            distance = x;
            return kmeans;
        };

        return kmeans;
    };

    function science_stats_kmeansCompare(a, b) {
        if (!a || !b || a.length !== b.length) return false;
        var n = a.length,
            i = -1;
        while (++i < n) if (a[i] !== b[i]) return false;
        return true;
    }

    // Returns an array of k distinct vectors randomly selected from the input
    // array of vectors. Returns null if k > n or if there are less than k distinct
    // objects in vectors.
    function science_stats_kmeansRandom(k, vectors) {
        var n = vectors.length;
        if (k > n) return null;

        var selected_vectors = [];
        var selected_indices = [];
        var tested_indices = {};
        var tested = 0;
        var selected = 0;
        var i,
            vector,
            select;

        while (selected < k) {
            if (tested === n) return null;

            var random_index = Math.floor(Math.random() * n);
            if (random_index in tested_indices) continue;

            tested_indices[random_index] = 1;
            tested++;
            vector = vectors[random_index];
            select = true;
            for (i = 0; i < selected; i++) {
                if (science_stats_kmeansCompare(vector, selected_vectors[i])) {
                    select = false;
                    break;
                }
            }
            if (select) {
                selected_vectors[selected] = vector;
                selected_indices[selected] = random_index;
                selected++;
            }
        }
        return selected_vectors;
    }
    science.stats.hcluster = function () {
        var distance = science.stats.distance.euclidean,
            linkage = "single"; // single, complete or average

        function hcluster(vectors) {
            var n = vectors.length,
                dMin = [],
                cSize = [],
                distMatrix = [],
                clusters = [],
                c1,
                c2,
                c1Cluster,
                c2Cluster,
                p,
                root,
                i,
                j;

            // Initialise distance matrix and vector of closest clusters.
            i = -1; while (++i < n) {
                dMin[i] = 0;
                distMatrix[i] = [];
                j = -1; while (++j < n) {
                    distMatrix[i][j] = i === j ? Infinity : distance(vectors[i], vectors[j]);
                    if (distMatrix[i][dMin[i]] > distMatrix[i][j]) dMin[i] = j;
                }
            }

            // create leaves of the tree
            i = -1; while (++i < n) {
                clusters[i] = [];
                clusters[i][0] = {
                    left: null,
                    right: null,
                    dist: 0,
                    centroid: vectors[i],
                    size: 1,
                    depth: 0
                };
                cSize[i] = 1;
            }

            // Main loop
            for (p = 0; p < n - 1; p++) {
                // find the closest pair of clusters
                c1 = 0;
                for (i = 0; i < n; i++) {
                    if (distMatrix[i][dMin[i]] < distMatrix[c1][dMin[c1]]) c1 = i;
                }
                c2 = dMin[c1];

                // create node to store cluster info 
                c1Cluster = clusters[c1][0];
                c2Cluster = clusters[c2][0];

                var newCluster = {
                    left: c1Cluster,
                    right: c2Cluster,
                    dist: distMatrix[c1][c2],
                    centroid: calculateCentroid(c1Cluster.size, c1Cluster.centroid,
                        c2Cluster.size, c2Cluster.centroid),
                    size: c1Cluster.size + c2Cluster.size,
                    depth: 1 + Math.max(c1Cluster.depth, c2Cluster.depth)
                };
                clusters[c1].splice(0, 0, newCluster);
                cSize[c1] += cSize[c2];

                // overwrite row c1 with respect to the linkage type
                for (j = 0; j < n; j++) {
                    switch (linkage) {
                        case "single":
                            if (distMatrix[c1][j] > distMatrix[c2][j])
                                distMatrix[j][c1] = distMatrix[c1][j] = distMatrix[c2][j];
                            break;
                        case "complete":
                            if (distMatrix[c1][j] < distMatrix[c2][j])
                                distMatrix[j][c1] = distMatrix[c1][j] = distMatrix[c2][j];
                            break;
                        case "average":
                            distMatrix[j][c1] = distMatrix[c1][j] = (cSize[c1] * distMatrix[c1][j] + cSize[c2] * distMatrix[c2][j]) / (cSize[c1] + cSize[j]);
                            break;
                    }
                }
                distMatrix[c1][c1] = Infinity;

                // infinity ­out old row c2 and column c2
                for (i = 0; i < n; i++)
                    distMatrix[i][c2] = distMatrix[c2][i] = Infinity;

                // update dmin and replace ones that previous pointed to c2 to point to c1
                for (j = 0; j < n; j++) {
                    if (dMin[j] == c2) dMin[j] = c1;
                    if (distMatrix[c1][j] < distMatrix[c1][dMin[c1]]) dMin[c1] = j;
                }

                // keep track of the last added cluster
                root = newCluster;
            }

            return root;
        }

        hcluster.distance = function (x) {
            if (!arguments.length) return distance;
            distance = x;
            return hcluster;
        };

        return hcluster;
    };

    function calculateCentroid(c1Size, c1Centroid, c2Size, c2Centroid) {
        var newCentroid = [],
            newSize = c1Size + c2Size,
            n = c1Centroid.length,
            i = -1;
        while (++i < n) {
            newCentroid[i] = (c1Size * c1Centroid[i] + c2Size * c2Centroid[i]) / newSize;
        }
        return newCentroid;
    }
    science.stats.iqr = function (x) {
        var quartiles = science.stats.quantiles(x, [.25, .75]);
        return quartiles[1] - quartiles[0];
    };
    // Based on org.apache.commons.math.analysis.interpolation.LoessInterpolator
    // from http://commons.apache.org/math/
    science.stats.loess = function () {
        var bandwidth = .3,
            robustnessIters = 2,
            accuracy = 1e-12;

        function smooth(xval, yval, weights) {
            var n = xval.length,
                i;

            if (n !== yval.length) throw { error: "Mismatched array lengths" };
            if (n == 0) throw { error: "At least one point required." };

            if (arguments.length < 3) {
                weights = [];
                i = -1; while (++i < n) weights[i] = 1;
            }

            science_stats_loessFiniteReal(xval);
            science_stats_loessFiniteReal(yval);
            science_stats_loessFiniteReal(weights);
            science_stats_loessStrictlyIncreasing(xval);

            if (n == 1) return [yval[0]];
            if (n == 2) return [yval[0], yval[1]];

            var bandwidthInPoints = Math.floor(bandwidth * n);

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
            while (++iter <= robustnessIters) {
                var bandwidthInterval = [0, bandwidthInPoints - 1];
                // At each x, compute a local weighted linear regression
                var x;
                i = -1; while (++i < n) {
                    x = xval[i];

                    // Find out the interval of source points on which
                    // a regression is to be made.
                    if (i > 0) {
                        science_stats_loessUpdateBandwidthInterval(xval, weights, i, bandwidthInterval);
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
                            w = science_stats_loessTricube(dist * denom) * robustnessWeights[k] * weights[k],
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

                    var beta = (Math.sqrt(Math.abs(meanXSquared - meanX * meanX)) < accuracy)
                        ? 0 : ((meanXY - meanX * meanY) / (meanXSquared - meanX * meanX));

                    var alpha = meanY - beta * meanX;

                    res[i] = beta * x + alpha;
                    residuals[i] = Math.abs(yval[i] - res[i]);
                }

                // No need to recompute the robustness weights at the last
                // iteration, they won't be needed anymore
                if (iter === robustnessIters) {
                    break;
                }

                // Recompute the robustness weights.

                // Find the median residual.
                var medianResidual = science.stats.median(residuals);

                if (Math.abs(medianResidual) < accuracy)
                    break;

                var arg,
                    w;
                i = -1; while (++i < n) {
                    arg = residuals[i] / (6 * medianResidual);
                    robustnessWeights[i] = (arg >= 1) ? 0 : ((w = 1 - arg * arg) * w);
                }
            }

            return res;
        }

        smooth.bandwidth = function (x) {
            if (!arguments.length) return x;
            bandwidth = x;
            return smooth;
        };

        smooth.robustnessIterations = function (x) {
            if (!arguments.length) return x;
            robustnessIters = x;
            return smooth;
        };

        smooth.accuracy = function (x) {
            if (!arguments.length) return x;
            accuracy = x;
            return smooth;
        };

        return smooth;
    };

    function science_stats_loessFiniteReal(values) {
        var n = values.length,
            i = -1;

        while (++i < n) if (!isFinite(values[i])) return false;

        return true;
    }

    function science_stats_loessStrictlyIncreasing(xval) {
        var n = xval.length,
            i = 0;

        while (++i < n) if (xval[i - 1] >= xval[i]) return false;

        return true;
    }

    // Compute the tricube weight function.
    // http://en.wikipedia.org/wiki/Local_regression#Weight_function
    function science_stats_loessTricube(x) {
        return (x = 1 - x * x * x) * x * x;
    }

    // Given an index interval into xval that embraces a certain number of
    // points closest to xval[i-1], update the interval so that it embraces
    // the same number of points closest to xval[i], ignoring zero weights.
    function science_stats_loessUpdateBandwidthInterval(
        xval, weights, i, bandwidthInterval) {

        var left = bandwidthInterval[0],
            right = bandwidthInterval[1];

        // The right edge should be adjusted if the next point to the right
        // is closer to xval[i] than the leftmost point of the current interval
        var nextRight = science_stats_loessNextNonzero(weights, right);
        if ((nextRight < xval.length) && (xval[nextRight] - xval[i]) < (xval[i] - xval[left])) {
            var nextLeft = science_stats_loessNextNonzero(weights, left);
            bandwidthInterval[0] = nextLeft;
            bandwidthInterval[1] = nextRight;
        }
    }

    function science_stats_loessNextNonzero(weights, i) {
        var j = i + 1;
        while (j < weights.length && weights[j] === 0) j++;
        return j;
    }
    // Welford's algorithm.
    science.stats.mean = function (x) {
        var n = x.length;
        if (n === 0) return NaN;
        var m = 0,
            i = -1;
        while (++i < n) m += (x[i] - m) / (i + 1);
        return m;
    };
    science.stats.median = function (x) {
        return science.stats.quantiles(x, [.5])[0];
    };
    science.stats.mode = function (x) {
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
    science.stats.quantiles = function (d, quantiles) {
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
    science.stats.variance = function (x) {
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
    science.stats.distribution = {
    };
    // From http://www.colingodsey.com/javascript-gaussian-random-number-generator/
    // Uses the Box-Muller Transform.
    science.stats.distribution.gaussian = function () {
        var random = Math.random,
            mean = 0,
            sigma = 1,
            variance = 1;

        function gaussian() {
            var x1,
                x2,
                rad,
                y1;

            do {
                x1 = 2 * random() - 1;
                x2 = 2 * random() - 1;
                rad = x1 * x1 + x2 * x2;
            } while (rad >= 1 || rad === 0);

            return mean + sigma * x1 * Math.sqrt(-2 * Math.log(rad) / rad);
        }

        gaussian.pdf = function (x) {
            x = (x - mean) / sigma;
            return science_stats_distribution_gaussianConstant * Math.exp(-.5 * x * x) / sigma;
        };

        gaussian.cdf = function (x) {
            x = (x - mean) / sigma;
            return .5 * (1 + science.stats.erf(x / Math.SQRT2));
        };

        gaussian.mean = function (x) {
            if (!arguments.length) return mean;
            mean = +x;
            return gaussian;
        };

        gaussian.variance = function (x) {
            if (!arguments.length) return variance;
            sigma = Math.sqrt(variance = +x);
            return gaussian;
        };

        gaussian.random = function (x) {
            if (!arguments.length) return random;
            random = x;
            return gaussian;
        };

        return gaussian;
    };

    science_stats_distribution_gaussianConstant = 1 / Math.sqrt(2 * Math.PI);
}