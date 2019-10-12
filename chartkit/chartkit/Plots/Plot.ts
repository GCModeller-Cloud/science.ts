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

    export interface metrics {
        max: number;
        quartile3: number;
        median: number;
        quartile1: number;
        min: number;
        upperInnerFence: number ;
        lowerInnerFence: number ;
        mean: number;
    }
}