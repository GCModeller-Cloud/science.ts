namespace D3.canvas {

    export abstract class Plot {

        protected abstract hookEvt();
        protected abstract reset();
        protected abstract update();

    }

    export interface PlotOptions {
        show: boolean;
        colors: null;
    }
}