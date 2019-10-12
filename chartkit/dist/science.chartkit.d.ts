/// <reference path="../../../build/linq.d.ts" />
/// <reference path="../../../build/svg.d.ts" />
declare namespace D3 {
    class Chart {
        settings: settings;
        yFormatter: D3.numberFormatter;
        data: any;
        /**
         * The data organized by grouping and sorted as
         * well as any metadata for the groups
        */
        groupObjs: {};
        objs: {
            mainDiv: any;
            chartDiv: any;
            g: any;
            xAxis: any;
            yAxis: any;
            tooltip: any;
            axes: any;
        };
        xScale: any;
        yScale: any;
        colorFunct: any;
        selector: string;
        width: number;
        height: number;
        margin: Canvas.Margin;
        range: number[];
        divWidth: number;
        divHeight: number;
        xAxisLable: string;
        yAxisLable: string;
        constructor(settings: settings);
        /**
         * Closure that creates the tooltip hover function
         *
         * @param groupName Name of the x group
         * @param metrics Object to use to get values for the group
         * @returns {Function} A function that provides the values for the tooltip
        */
        tooltipHover(groupName: any, metrics: any): () => void;
        /**
         * Takes an array, function, or object mapping and created a color function from it
         *
         * @param {function|[]|object} colorOptions
         * @returns {function} Function to be used to determine chart colors
        */
        getColorFunct(colorOptions: any): any;
        /**
         * Takes a percentage as returns the values that correspond to
         * that percentage of the group range witdh
         *
         * @param objWidth Percentage of range band
         * @param gName The bin name to use to get the x shift
         * @returns {{left: null, right: null, middle: null}}
        */
        getObjWidth(objWidth: any, gName: any): {
            left: any;
            right: any;
            middle: any;
        };
        /**
         * Updates the chart based on the current settings and window size
         *
         * @returns {*}
        */
        update(): this;
        /**
         * Render a violin plot on the current chart
         *
         * @param options
         * @param [options.showViolinPlot=true] True or False, show the violin plot
         * @param [options.resolution=100 default]
         * @param [options.bandwidth=10 default] May need higher bandwidth for larger data sets
         * @param [options.width=50] The max percent of the group rangeBand that the violin can be
         * @param [options.interpolation=''] How to render the violin
         * @param [options.clamp=0 default]
         *   0 = keep data within chart min and max, clamp once data = 0. May extend beyond data set min and max
         *   1 = clamp at min and max of data set. Possibly no tails
         *  -1 = extend chart axis to make room for data to interpolate to 0. May extend axis and data set min and max
         * @param [options.colors=chart default] The color mapping for the violin plot
         * @returns {*} The chart object
         */
        renderViolinPlot(options: any): canvas.violinPlot;
        /**
         * Render a box plot on the current chart
         *
         * @param options
         * @param [options.show=true] Toggle the whole plot on and off
         * @param [options.showBox=true] Show the box part of the box plot
         * @param [options.showWhiskers=true] Show the whiskers
         * @param [options.showMedian=true] Show the median line
         * @param [options.showMean=false] Show the mean line
         * @param [options.medianCSize=3] The size of the circle on the median
         * @param [options.showOutliers=true] Plot outliers
         * @param [options.boxwidth=30] The max percent of the group rangeBand that the box can be
         * @param [options.lineWidth=boxWidth] The max percent of the group rangeBand that the line can be
         * @param [options.outlierScatter=false] Spread out the outliers so they don't all overlap (in development)
         * @param [options.outlierCSize=2] Size of the outliers
         * @param [options.colors=chart default] The color mapping for the box plot
         * @returns {*} The chart object
         */
        renderBoxPlot(options: any): canvas.boxPlot;
        /**
         * Render a notched box on the current chart
         *
         * @param options
         * @param [options.show=true] Toggle the whole plot on and off
         * @param [options.showNotchBox=true] Show the notch box
         * @param [options.showLines=false] Show lines at the confidence intervals
         * @param [options.boxWidth=35] The width of the widest part of the box
         * @param [options.medianWidth=20] The width of the narrowist part of the box
         * @param [options.lineWidth=50] The width of the confidence interval lines
         * @param [options.notchStyle=null] null=traditional style, 'box' cuts out the whole notch in right angles
         * @param [options.colors=chart default] The color mapping for the notch boxes
         * @returns {*} The chart object
         */
        renderNotchBoxes(options: any): canvas.notchBoxes;
        /**
         * Render a raw data in various forms
         *
         * @param options
         * @param [options.show=true] Toggle the whole plot on and off
         * @param [options.showPlot=false] True or false, show points
         * @param [options.plotType='none'] Options: no scatter = (false or 'none'); scatter points= (true or [amount=% of width (default=10)]); beeswarm points = ('beeswarm')
         * @param [options.pointSize=6] Diameter of the circle in pizels (not the radius)
         * @param [options.showLines=['median']] Can equal any of the metrics lines
         * @param [options.showbeanLines=false] Options: no lines = false
         * @param [options.beanWidth=20] % width
         * @param [options.colors=chart default]
         * @returns {*} The chart object
         *
         */
        renderDataPlots(options: any): canvas.dataPlot;
    }
}
declare namespace D3.app {
    function init(chart: Chart): Chart;
}
/**
 * Creates a box plot, violin plot, and or notched box plot
 *
 * @param settings Configuration options for the base plot
 * @param settings.data The data for the plot
 * @param settings.xName The name of the column that should be used for the x groups
 * @param settings.yName The name of the column used for the y values
 * @param {string} settings.selector The selector string for the main chart div
 * @param [settings.axisLabels={}] Defaults to the xName and yName
 * @param [settings.yTicks = 1] 1 = default ticks. 2 =  double, 0.5 = half
 * @param [settings.scale='linear'] 'linear' or 'log' - y scale of the chart
 * @param [settings.chartSize={width:800, height:400}] The height and width of the chart itself (doesn't include the container)
 * @param [settings.margin={top: 15, right: 60, bottom: 40, left: 50}] The margins around the chart (inside the main div)
 * @param [settings.constrainExtremes=false] Should the y scale include outliers?
 * @returns {object} chart A chart object
*/
declare function makeDistroChart(settings: D3.settings): D3.Chart;
declare namespace D3 {
    function formatAsFloat(d: number): string;
    function logFormatNumber(d: number): string;
    interface numberFormatter {
        (d: number): string;
    }
    /**
     * Adds jitter to the  scatter point plot
     *
     * @param doJitter true or false, add jitter to the point
     * @param width percent of the range band to cover with the jitter
     * @returns {number}
     */
    function addJitter(doJitter: boolean, width: number): number;
    function kernelDensityEstimator(kernel: any, x: any): (sample: any) => any;
    function eKernel(scale: any): (u: any) => number;
    function eKernelTest(kernel: any, array: any): (testX: any) => number;
}
declare namespace D3 {
    /**
     * Configuration options for the base plot
    */
    interface settings {
        /**
         * The data for the plot
        */
        data: null;
        /**
         * The name of the column that should be used for the x groups
        */
        xName: string;
        /**
         * The name of the column used for the y values
        */
        yName: string;
        /**
         * The selector string for the main chart div
        */
        selector: string;
        /**
         * Defaults to the xName and yName
        */
        axisLabels: string[];
        /**
         * 1 = default ticks. 2 =  double, 0.5 = half
        */
        yTicks: number;
        /**
         * 'linear' or 'log' - y scale of the chart
        */
        scale: string;
        chartSize: {
            width: number;
            height: number;
        };
        margin: Canvas.Margin;
        /**
         * Should the y scale include outliers?
        */
        constrainExtremes: boolean;
        color: any;
    }
}
declare namespace D3.canvas {
    abstract class Plot {
        protected abstract hookEvt(): any;
        protected abstract reset(): any;
        protected abstract update(): any;
    }
    interface PlotOptions {
        show: boolean;
        colors: null;
    }
}
declare namespace D3.canvas {
    interface boxPlotOptions extends PlotOptions {
        showBox: boolean;
        showWhiskers: boolean;
        showMedian: boolean;
        showMean: boolean;
        medianCSize: number;
        showOutliers: boolean;
        boxWidth: number;
        lineWidth: number;
        scatterOutliers: boolean;
        outlierCSize: number;
    }
    class boxPlot extends Plot {
        chart: Chart;
        static readonly defaultOptions: boxPlotOptions;
        bOpts: boxPlotOptions;
        constructor(chart: Chart, options: any);
        protected hookEvt(): void;
        /**
         * Calculates all the outlier points for each group
         */
        private calcAllOutliers;
        /**
         * Take updated options and redraw the box plot
         * @param updateOptions
         */
        change(updateOptions: any): void;
        reset(): void;
        show(opts: any): void;
        hide(opts: any): void;
        /**
         * Update the box plot obj values
         */
        update(): void;
        /**
         * Create the svg elements for the box plot
         */
        prepareBoxPlot(): void;
    }
}
declare namespace D3.canvas {
    interface dataPlotOptions extends PlotOptions {
        showPlot: boolean;
        plotType: string;
        pointSize: number;
        showLines: boolean;
        showBeanLines: boolean;
        beanWidth: number;
    }
    class dataPlot extends Plot {
        chart: Chart;
        static readonly defaultOptions: dataPlotOptions;
        private dOpts;
        /**
         * The lines don't fit into a group bucket so they live under the dataPlot object
        */
        private objs;
        constructor(chart: Chart, options: any);
        /**
         * Take updated options and redraw the data plots
         * @param updateOptions
         */
        change(updateOptions: any): void;
        reset(): void;
        show(opts: any): void;
        hide(opts: any): void;
        /**
         * Update the data plot obj values
         */
        update(): void;
        /**
         * Create the svg elements for the data plots
         */
        preparePlots(): void;
        protected hookEvt(): void;
    }
}
declare namespace D3.canvas {
    interface notchBoxesOptions extends PlotOptions {
        showNotchBox: boolean;
        showLines: boolean;
        boxWidth: number;
        medianWidth: number;
        lineWidth: number;
        notchStyle: string;
    }
    class notchBoxes extends Plot {
        chart: Chart;
        static readonly defaultOptions: notchBoxesOptions;
        private nOpts;
        constructor(chart: Chart, options: any);
        /**
         * Makes the svg path string for a notched box
         * @param cNotch Current notch box object
         * @param notchBounds objBound object
         * @returns {string} A string in the proper format for a svg polygon
         */
        private makeNotchBox;
        /**
         * Take a new set of options and redraw the notch boxes
         * @param updateOptions
         */
        change(updateOptions: any): void;
        reset(): void;
        show(opts: any): void;
        hide(opts: any): void;
        /**
         * Update the notch box obj values
         */
        update(): void;
        /**
         * Create the svg elements for the notch boxes
         */
        prepareNotchBoxes(): void;
        protected hookEvt(): void;
    }
}
declare namespace D3.canvas {
    interface violinPlotOptions extends PlotOptions {
        /**
         * If the Violin plot is set to close all violin plots, it may
         * need to extend the domain, that extended domain is stored
         * here
        */
        _yDomainVP: {};
        showViolinPlot: boolean;
        resolution: number;
        bandwidth: number;
        width: number;
        interpolation: string;
        clamp: number;
    }
    class violinPlot extends Plot {
        chart: Chart;
        static readonly defaultOptions: violinPlotOptions;
        vOpts: violinPlotOptions;
        constructor(chart: Chart, options: any);
        protected hookEvt(): void;
        /**
         * Take a new set of options and redraw the violin
         * @param updateOptions
        */
        change(updateOptions: any): void;
        reset(): void;
        show(opts: any): void;
        hide(opts: any): void;
        /**
         * Update the violin obj values
         */
        update(): void;
        /**
         * Create the svg elements for the violin plot
         */
        prepareViolin(): void;
    }
}
