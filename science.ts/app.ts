/// <reference path="modules/Quadratic.ts" />

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
    export const quadratic: quadraticFunction = new quadraticFunction();
}