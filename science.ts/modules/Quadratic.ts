namespace science {

    export class quadraticFunction {

        private m_complex: boolean = false;

        quadratic(a: number, b: number, c: number): number[] | complexNumber[] {
            var d = b * b - 4 * a * c;

            if (d > 0) {
                d = Math.sqrt(d) / (2 * a);
                return this.m_complex
                    ? [<complexNumber>{ r: -b - d, i: 0 }, <complexNumber>{ r: -b + d, i: 0 }]
                    : [-b - d, -b + d];

            } else if (d === 0) {
                d = -b / (2 * a);
                return this.m_complex ? [<complexNumber>{ r: d, i: 0 }] : [d];

            } else {
                if (this.m_complex) {
                    d = Math.sqrt(-d) / (2 * a);
                    return [
                        <complexNumber>{ r: -b, i: -d },
                        <complexNumber>{ r: -b, i: d }
                    ];
                }
                return [];
            }
        }

        complex = function (x?: boolean) {
            if (!arguments.length) {
                return this.m_complex;
            } else {
                this.m_complex = x;
            }

            return quadratic;
        }
    };

    export interface complexNumber {
        r: number;
        i: number;
    }
}