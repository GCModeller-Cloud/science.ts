namespace science.lin {

    export function cross(a, b) {
        // TODO how to handle non-3D vectors?
        // TODO handle 7D vectors?
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    };

    export function dot(a, b) {
        var s = 0,
            i = -1,
            n = Math.min(a.length, b.length);
        while (++i < n) s += a[i] * b[i];

        return s;
    };

    export function length(p) {
        return Math.sqrt(science.lin.dot(p, p));
    };

    export function normalize(p) {
        var length = science.lin.length(p);
        return p.map(d => d / length);
    };

    // 4x4 matrix determinant.
    export function determinant(matrix) {
        var m = matrix[0].concat(matrix[1]).concat(matrix[2]).concat(matrix[3]);
        return (
            m[12] * m[9] * m[6] * m[3] - m[8] * m[13] * m[6] * m[3] -
            m[12] * m[5] * m[10] * m[3] + m[4] * m[13] * m[10] * m[3] +
            m[8] * m[5] * m[14] * m[3] - m[4] * m[9] * m[14] * m[3] -
            m[12] * m[9] * m[2] * m[7] + m[8] * m[13] * m[2] * m[7] +
            m[12] * m[1] * m[10] * m[7] - m[0] * m[13] * m[10] * m[7] -
            m[8] * m[1] * m[14] * m[7] + m[0] * m[9] * m[14] * m[7] +
            m[12] * m[5] * m[2] * m[11] - m[4] * m[13] * m[2] * m[11] -
            m[12] * m[1] * m[6] * m[11] + m[0] * m[13] * m[6] * m[11] +
            m[4] * m[1] * m[14] * m[11] - m[0] * m[5] * m[14] * m[11] -
            m[8] * m[5] * m[2] * m[15] + m[4] * m[9] * m[2] * m[15] +
            m[8] * m[1] * m[6] * m[15] - m[0] * m[9] * m[6] * m[15] -
            m[4] * m[1] * m[10] * m[15] + m[0] * m[5] * m[10] * m[15]);
    };

    // Performs in-place Gauss-Jordan elimination.
    //
    // Based on Jarno Elonen's Python version (public domain):
    // http://elonen.iki.fi/code/misc-notes/python-gaussj/index.html
    export function gaussjordan(m, eps: number = 1e-10) {
        var h = m.length,
            w = m[0].length,
            y = -1,
            y2,
            x;
        var c: number;

        while (++y < h) {
            var maxrow = y;

            // Find max pivot.
            y2 = y; while (++y2 < h) {
                if (Math.abs(m[y2][y]) > Math.abs(m[maxrow][y]))
                    maxrow = y2;
            }

            // Swap.
            var tmp = m[y];
            m[y] = m[maxrow];
            m[maxrow] = tmp;

            // Singular?
            if (Math.abs(m[y][y]) <= eps) return false;

            // Eliminate column y.
            y2 = y; while (++y2 < h) {
                c = m[y2][y] / m[y][y];
                x = y - 1; while (++x < w) {
                    m[y2][x] -= m[y][x] * c;
                }
            }
        }

        // Backsubstitute.
        y = h; while (--y >= 0) {
            c = m[y][y];
            y2 = -1; while (++y2 < y) {
                x = w; while (--x >= y) {
                    m[y2][x] -= m[y][x] * m[y2][y] / c;
                }
            }
            m[y][y] /= c;
            // Normalize row y.
            x = h - 1; while (++x < w) {
                m[y][x] /= c;
            }
        }
        return true;
    };

    // Find matrix inverse using Gauss-Jordan.
    export function inverse(m) {
        var n = m.length,
            i = -1;

        // Check if the matrix is square.
        if (n !== m[0].length) return;

        // Augment with identity matrix I to get AI.
        m = m.map(function (row, i) {
            var identity = new Array(n),
                j = -1;
            while (++j < n) identity[j] = i === j ? 1 : 0;
            return row.concat(identity);
        });

        // Compute IA^-1.
        science.lin.gaussjordan(m);

        // Remove identity matrix I to get A^-1.
        while (++i < n) {
            m[i] = m[i].slice(n);
        }

        return m;
    };
    export function multiply(a, b) {
        var m = a.length,
            n = b[0].length,
            p = b.length,
            i = -1,
            j,
            k;
        if (p !== a[0].length) throw { "error": "columns(a) != rows(b); " + a[0].length + " != " + p };
        var ab = new Array(m);
        while (++i < m) {
            ab[i] = new Array(n);
            j = -1; while (++j < n) {
                var s = 0;
                k = -1; while (++k < p) s += a[i][k] * b[k][j];
                ab[i][j] = s;
            }
        }
        return ab;
    };
    export function transpose(a) {
        var m = a.length,
            n = a[0].length,
            i = -1,
            j,
            b = new Array(n);
        while (++i < n) {
            b[i] = new Array(m);
            j = -1; while (++j < m) b[i][j] = a[j][i];
        }
        return b;
    };
    /**
     * Solves tridiagonal systems of linear equations.
     *
     * Source: http://en.wikipedia.org/wiki/Tridiagonal_matrix_algorithm
     *
     * @param {number[]} a
     * @param {number[]} b
     * @param {number[]} c
     * @param {number[]} d
     * @param {number[]} x
     * @param {number} n
     */
    export function tridag(a, b, c, d, x, n) {
        var i,
            m;
        for (i = 1; i < n; i++) {
            m = a[i] / b[i - 1];
            b[i] -= m * c[i - 1];
            d[i] -= m * d[i - 1];
        }
        x[n - 1] = d[n - 1] / b[n - 1];
        for (i = n - 2; i >= 0; i--) {
            x[i] = (d[i] - c[i] * x[i + 1]) / b[i];
        }
    };
}