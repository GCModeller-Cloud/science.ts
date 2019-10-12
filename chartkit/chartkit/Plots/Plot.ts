namespace D3.canvas {

    export abstract class Plot {

        protected colorFunct: getColorFunct;

        protected abstract hookEvt();
        protected abstract reset();
        protected abstract update();

    }

    export interface PlotOptions {
        show: boolean;
        colors: getColorFunct;
    }

    /**
     * These are the original non-scaled values
    */
    export interface metrics {
        max: number;
        quartile3: number;
        median: number;
        quartile1: number;
        min: number;
        upperInnerFence: number;
        lowerInnerFence: number;
        lowerOuterFence: number;
        upperOuterFence: number;
        mean: number;
        upperNotch: number;
        lowerNotch: number;
        iqr: number;
    }

    export interface objectBounds {
        left: number;
        right: number;
        middle: number;
    }
}