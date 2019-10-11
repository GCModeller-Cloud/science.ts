namespace science {

    /**
     * semver
    */
    export const version: string = "1.9.3";

    /**
     * Euler's constant.
    */
    export const EULER = .5772156649015329;
    export const gaussianConstant = 1 / Math.sqrt(2 * Math.PI);

    function quadraticInternal(): IQuadratic {
        var complex: boolean = false;
        var quadratic: any = function (a: number, b: number, c: number): number[] | complexNumber[] {
            var d = b * b - 4 * a * c;

            if (d > 0) {
                d = Math.sqrt(d) / (2 * a);
                return complex
                    ? [<complexNumber>{ r: -b - d, i: 0 }, <complexNumber>{ r: -b + d, i: 0 }]
                    : [-b - d, -b + d];

            } else if (d === 0) {
                d = -b / (2 * a);
                return complex ? [<complexNumber>{ r: d, i: 0 }] : [d];

            } else {
                if (complex) {
                    d = Math.sqrt(-d) / (2 * a);
                    return [
                        <complexNumber>{ r: -b, i: -d },
                        <complexNumber>{ r: -b, i: d }
                    ];
                }
                return [];
            }
        }

        quadratic.complex = function (x?: boolean) {
            if (!arguments.length) {
                return complex;
            } else {
                complex = x;
            }

            return quadratic;
        };

        return quadratic;
    };

    export interface IQuadratic {
        /**
         * Do calculation
        */
        (a: number, b: number, c: number): number[] | complexNumber[];
        /**
         * Config function output
        */
        complex(config?: boolean): boolean | IQuadratic;
    }

    export interface complexNumber {
        r: number;
        i: number;
    }

    export const quadratic: IQuadratic = quadraticInternal();
}