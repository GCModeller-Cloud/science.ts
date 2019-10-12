namespace D3 {

    export interface getColorFunct {
        (group: string): string;
    }

    export class Chart {

        public yFormatter: D3.numberFormatter;
        public data: any;
        /**
         * The data organized by grouping and sorted as 
         * well as any metadata for the groups
        */
        public groupObjs: {}
        public objs = {
            mainDiv: null,
            chartDiv: null,
            g: null,
            xAxis: null,
            yAxis: null,
            tooltip: null,
            axes: null
        };

        public xScale = null;
        public yScale = null;
        public colorFunct: getColorFunct = null;

        public selector: string;

        public width: number;
        public height: number;
        public margin: Canvas.Margin;

        public range: number[];

        public divWidth: number;
        public divHeight: number;

        public xAxisLable: string;
        public yAxisLable: string;

        constructor(public settings: settings) {
            this.data = settings.data;
            this.yFormatter = D3.formatAsFloat;
        }

        /**
         * Closure that creates the tooltip hover function
         * 
         * @param groupName Name of the x group
         * @param metrics Object to use to get values for the group
         * @returns {Function} A function that provides the values for the tooltip
        */
        tooltipHover(groupName: string, metrics: canvas.metrics) {
            var tooltipString = "Group: " + groupName;
            let vm = this.objs;

            tooltipString += "<br\>Max: " + D3.formatAsFloat(metrics.max);
            tooltipString += "<br\>Q3: " + D3.formatAsFloat(metrics.quartile3);
            tooltipString += "<br\>Median: " + D3.formatAsFloat(metrics.median);
            tooltipString += "<br\>Q1: " + D3.formatAsFloat(metrics.quartile1);
            tooltipString += "<br\>Min: " + D3.formatAsFloat(metrics.min);

            return function () {
                vm.tooltip.transition().duration(200).style("opacity", 0.9);
                vm.tooltip.html(tooltipString)
            };
        }

        /**
         * Takes an array, function, or object mapping and created a color function from it
         * 
         * @param {function|[]|object} colorOptions
         * @returns {function} Function to be used to determine chart colors
        */
        getColorFunct(colorOptions: any): getColorFunct {
            if (typeof colorOptions == 'function') {
                return colorOptions
            } else if (Array.isArray(colorOptions)) {
                //  If an array is provided, map it to the domain
                let colorMap = {}, cColor = 0;

                for (var cName in this.groupObjs) {
                    colorMap[cName] = colorOptions[cColor];
                    cColor = (cColor + 1) % colorOptions.length;
                }
                return function (group: string) {
                    return colorMap[group];
                }
            } else if (typeof colorOptions == 'object') {
                // if an object is provided, assume it maps to  the colors
                return function (group: string) {
                    return colorOptions[group];
                }
            } else {
                return d3.scale.category10();
            }
        }

        /**
         * Takes a percentage as returns the values that correspond to 
         * that percentage of the group range witdh
         * 
         * @param objWidth Percentage of range band
         * @param gName The bin name to use to get the x shift
         * @returns {{left: null, right: null, middle: null}}
        */
        getObjWidth(objWidth: number, gName: string): canvas.objectBounds {
            var width: number = this.xScale.rangeBand() * (objWidth / 100);
            var padding: number = (this.xScale.rangeBand() - width) / 2;
            var gShift: number = this.xScale(gName);
            var objSize = <canvas.objectBounds>{
                left: padding + gShift,
                right: objSize.left + width,
                middle: this.xScale.rangeBand() / 2 + gShift
            };

            return objSize;
        }

        /**
         * Updates the chart based on the current settings and window size
         * 
         * @returns {*}
        */
        update() {
            let vm = this.objs;
            let chart = this;

            // Update chart size based on view port size
            this.width = parseInt(vm.chartDiv.style("width"), 10) - (this.margin.left + this.margin.right);
            this.height = parseInt(vm.chartDiv.style("height"), 10) - (this.margin.top + this.margin.bottom);

            // Update scale functions
            this.xScale.rangeBands([0, this.width]);
            this.yScale.range([this.height, 0]);

            // Update the yDomain if the Violin plot clamp is set to -1 meaning it will extend the violins to make nice points
            if (chart.violinPlots && chart.violinPlots.options.show == true && chart.violinPlots.options._yDomainVP != null) {
                this.yScale.domain(chart.violinPlots.options._yDomainVP).nice().clamp(true);
            } else {
                this.yScale.domain(chart.range).nice().clamp(true);
            }

            //Update axes       
            vm.g.select('.x.axis')
                .attr("transform", "translate(0," + this.height + ")")
                .call(vm.xAxis)
                .selectAll("text")
                .attr("y", 5)
                .attr("x", -5)
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end");
            vm.g.select('.x.axis .label').attr("x", this.width / 2);
            vm.g.select('.y.axis').call(vm.yAxis.innerTickSize(-this.width));
            vm.g.select('.y.axis .label').attr("x", -this.height / 2);

            vm.chartDiv.select('svg')
                .attr("width", this.width + (this.margin.left + this.margin.right))
                .attr("height", this.height + (this.margin.top + this.margin.bottom));

            return this;
        };

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
        renderViolinPlot(options: D3.canvas.violinPlotOptions) {
            return new D3.canvas.violinPlot(this, options);
        };

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
        renderBoxPlot(options: D3.canvas.boxPlotOptions) {
            return new D3.canvas.boxPlot(this, options);
        };

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
        renderNotchBoxes(options: D3.canvas.notchBoxesOptions) {
            return new D3.canvas.notchBoxes(this, options);
        };

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
        renderDataPlots(options: D3.canvas.dataPlotOptions) {
            return new D3.canvas.dataPlot(this, options);
        };
    }
}