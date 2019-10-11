namespace science {

    export function ascending(a: number, b: number): number {
        return a - b;
    };

    // Compute exp(x) - 1 accurately for small x.
    export function expm1(x) {
        return (x < 1e-5 && x > -1e-5) ? x + .5 * x * x : Math.exp(x) - 1;
    };
    export function functor(v) {
        return typeof v === "function" ? v : function () { return v; };
    };
    // Based on:
    // http://www.johndcook.com/blog/2010/06/02/whats-so-hard-about-finding-a-hypotenuse/
    export function hypot(x, y) {
        x = Math.abs(x);
        y = Math.abs(y);
        var max,
            min;
        if (x > y) { max = x; min = y; }
        else { max = y; min = x; }
        var r = min / max;
        return max * Math.sqrt(1 + r * r);
    };  

    /**
     * Constructs a multi-dimensional array filled with zeroes.
    */
    export function zeroes(n: number) {
        var i = -1;
        var a: number[] = [];

        if (arguments.length === 1)
            while (++i < n)
                a[i] = 0;
        else
            while (++i < n)
                a[i] = science.zeroes.apply(
                    this, Array.prototype.slice.call(arguments, 1));
        return a;
    };
}


