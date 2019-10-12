/// <reference path="../../../build/svg.d.ts" />

namespace D3 {

    /**
     * Configuration options for the base plot
    */
    export interface settings {
        /**
         * The data for the plot
        */
        data: null;
        /**
         * The name of the column that should be used for the x groups
        */
        xName: string
        /**
         * The name of the column used for the y values
        */
        yName: string
        /**
         * The selector string for the main chart div
        */
        selector: string
        /**
         * Defaults to the xName and yName
        */
        axisLables: string[]
        /**
         * 1 = default ticks. 2 =  double, 0.5 = half
        */
        yTicks: number
        /**
         * 'linear' or 'log' - y scale of the chart
        */
        scale: string
        chartSize: { width: number, height: number } 
        margin: Canvas.Margin;

        /**
         * Should the y scale include outliers?
        */
        constrainExtremes: boolean
        color: any
    }
}