namespace science {

    /**
     * semver
    */
    export const version: string = "1.9.3";

    /**
     * Euler's constant.
    */
    export const EULER = .5772156649015329;

    function quadraticInternal(): IQuadratic {
        var complex: boolean = false;
        var quadratic: any = function (a: number, b: number, c: number): number[] {
            var d = b * b - 4 * a * c;

            if (d > 0) {
                d = Math.sqrt(d) / (2 * a);
                return complex
                    ? [{ r: -b - d, i: 0 }, { r: -b + d, i: 0 }]
                    : [-b - d, -b + d];
            } else if (d === 0) {
                d = -b / (2 * a);
                return complex ? [{ r: d, i: 0 }] : [d];
            } else {
                if (complex) {
                    d = Math.sqrt(-d) / (2 * a);
                    return [
                        { r: -b, i: -d },
                        { r: -b, i: d }
                    ];
                }
                return [];
            }
        }

        quadratic.complex = function (x) {
            if (!arguments.length) return complex;
            complex = x;
            return quadratic;
        };

        return quadratic;
    };

    export interface IQuadratic {
        /**
         * Do calculation
        */
        (a: number, b: number, c: number): number[];
        /**
         * Config function output
        */
        complex(config?: boolean): boolean;
    }

    export const quadratic: IQuadratic = quadraticInternal();
}