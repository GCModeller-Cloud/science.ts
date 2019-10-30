namespace D3 {

    export function formatAsFloat(d: number) {
        if (d % 1 !== 0) {
            return d3.format(".2f")(d);
        } else {
            return d3.format(".0f")(d);
        }
    }

    export function logFormatNumber(d: number) {
        var x = Math.log(d) / Math.log(10) + 1e-6;
        return Math.abs(x - Math.floor(x)) < 0.6 ? formatAsFloat(d) : "";
    }

    export interface numberFormatter { (d: number): string; }
    export interface kernelFunction { (x: number): number; }

    /**
     * Adds jitter to the  scatter point plot
     * 
     * @param doJitter true or false, add jitter to the point
     * @param width percent of the range band to cover with the jitter
     * @returns {number}
     */
    export function addJitter(doJitter: boolean, width: number) {
        if (doJitter !== true || width == 0) {
            return 0
        }
        return Math.floor(Math.random() * width) - width / 2;
    }

    export function kernelDensityEstimator(kernel: kernelFunction, x: number[]) {
        return function (sample: number[]) {
            return x.map(function (x) {
                return {
                    x: x,
                    y: d3.mean(sample, v => kernel(x - v))
                };
            });
        };
    }

    export function eKernel(scale: number) {
        return function (u: number) {
            return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
        };
    }

    // Used to find the roots for adjusting violin axis
    // Given an array, find the value for a single point, even if it is not in the domain
    export function eKernelTest(kernel: kernelFunction, array: number[]) {
        return function (testX) {
            return d3.mean(array, v => kernel(testX - v))
        }
    }
}