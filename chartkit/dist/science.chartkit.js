var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var D3;
(function (D3) {
    var Chart = /** @class */ (function () {
        function Chart(settings) {
            this.settings = settings;
            /**
             * The data organized by grouping and sorted as
             * well as any metadata for the groups
            */
            this.groupObjs = {};
            this.objs = {
                mainDiv: null,
                chartDiv: null,
                g: null,
                xAxis: null,
                yAxis: null,
                tooltip: null,
                axes: null
            };
            this.xScale = null;
            this.yScale = null;
            this.colorFunct = null;
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
        Chart.prototype.tooltipHover = function (groupName, metrics) {
            var tooltipString = "Group: " + groupName;
            var vm = this.objs;
            tooltipString += "<br\>Max: " + D3.formatAsFloat(metrics.max);
            tooltipString += "<br\>Q3: " + D3.formatAsFloat(metrics.quartile3);
            tooltipString += "<br\>Median: " + D3.formatAsFloat(metrics.median);
            tooltipString += "<br\>Q1: " + D3.formatAsFloat(metrics.quartile1);
            tooltipString += "<br\>Min: " + D3.formatAsFloat(metrics.min);
            return function () {
                vm.tooltip.transition().duration(200).style("opacity", 0.9);
                vm.tooltip.html(tooltipString);
            };
        };
        /**
         * Takes an array, function, or object mapping and created a color function from it
         *
         * @param {function|[]|object} colorOptions
         * @returns {function} Function to be used to determine chart colors
        */
        Chart.prototype.getColorFunct = function (colorOptions) {
            if (typeof colorOptions == 'function') {
                return colorOptions;
            }
            else if (Array.isArray(colorOptions)) {
                //  If an array is provided, map it to the domain
                var colorMap_1 = {}, cColor = 0;
                for (var cName in this.groupObjs) {
                    colorMap_1[cName] = colorOptions[cColor];
                    cColor = (cColor + 1) % colorOptions.length;
                }
                return function (group) {
                    return colorMap_1[group];
                };
            }
            else if (typeof colorOptions == 'object') {
                // if an object is provided, assume it maps to  the colors
                return function (group) {
                    return colorOptions[group];
                };
            }
            else {
                return d3.scale.category10();
            }
        };
        /**
         * Takes a percentage as returns the values that correspond to
         * that percentage of the group range witdh
         *
         * @param objWidth Percentage of range band
         * @param gName The bin name to use to get the x shift
         * @returns {{left: null, right: null, middle: null}}
        */
        Chart.prototype.getObjWidth = function (objWidth, gName) {
            var width = this.xScale.rangeBand() * (objWidth / 100);
            var padding = (this.xScale.rangeBand() - width) / 2;
            var gShift = this.xScale(gName);
            var left = padding + gShift;
            var objSize = {
                left: left,
                right: left + width,
                middle: this.xScale.rangeBand() / 2 + gShift
            };
            return objSize;
        };
        /**
         * Updates the chart based on the current settings and window size
         *
         * @returns {*}
        */
        Chart.prototype.update = function () {
            var vm = this.objs;
            var chart = this;
            // Update chart size based on view port size
            this.width = parseInt(vm.chartDiv.style("width"), 10) - (this.margin.left + this.margin.right);
            this.height = parseInt(vm.chartDiv.style("height"), 10) - (this.margin.top + this.margin.bottom);
            // Update scale functions
            this.xScale.rangeBands([0, this.width]);
            this.yScale.range([this.height, 0]);
            // Update the yDomain if the Violin plot clamp is set to -1 meaning it will extend the violins to make nice points
            if (chart.violinPlots && chart.violinPlots.options.show == true && chart.violinPlots.options._yDomainVP != null) {
                this.yScale.domain(chart.violinPlots.options._yDomainVP).nice().clamp(true);
            }
            else {
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
        ;
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
        Chart.prototype.renderViolinPlot = function (options) {
            return new D3.canvas.violinPlot(this, options);
        };
        ;
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
        Chart.prototype.renderBoxPlot = function (options) {
            return new D3.canvas.boxPlot(this, options);
        };
        ;
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
        Chart.prototype.renderNotchBoxes = function (options) {
            return new D3.canvas.notchBoxes(this, options);
        };
        ;
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
        Chart.prototype.renderDataPlots = function (options) {
            return new D3.canvas.dataPlot(this, options);
        };
        ;
        return Chart;
    }());
    D3.Chart = Chart;
})(D3 || (D3 = {}));
var D3;
(function (D3) {
    var app;
    (function (app) {
        function calcMetrics(values) {
            var metrics = {};
            metrics.min = d3.min(values);
            metrics.quartile1 = d3.quantile(values, 0.25);
            metrics.median = d3.median(values);
            metrics.mean = d3.mean(values);
            metrics.quartile3 = d3.quantile(values, 0.75);
            metrics.max = d3.max(values);
            metrics.iqr = metrics.quartile3 - metrics.quartile1;
            // The inner fences are the closest value to the IQR 
            // without going past it (assumes sorted lists)
            var LIF = metrics.quartile1 - (1.5 * metrics.iqr);
            var UIF = metrics.quartile3 + (1.5 * metrics.iqr);
            for (var i = 0; i <= values.length; i++) {
                if (values[i] < LIF) {
                    continue;
                }
                if (!metrics.lowerInnerFence && values[i] >= LIF) {
                    metrics.lowerInnerFence = values[i];
                    continue;
                }
                if (values[i] > UIF) {
                    metrics.upperInnerFence = values[i - 1];
                    break;
                }
            }
            metrics.lowerOuterFence = metrics.quartile1 - (3 * metrics.iqr);
            metrics.upperOuterFence = metrics.quartile3 + (3 * metrics.iqr);
            if (!metrics.lowerInnerFence) {
                metrics.lowerInnerFence = metrics.min;
            }
            if (!metrics.upperInnerFence) {
                metrics.upperInnerFence = metrics.max;
            }
            return metrics;
        }
        function init(chart) {
            console.dir(chart);
            /**
             * Parse the data and calculates base values for the plots
            */
            !function prepareData() {
                var current_x = null;
                var current_y = null;
                // Group the values
                for (var _i = 0, _a = chart.data; _i < _a.length; _i++) {
                    var current_row = _a[_i];
                    current_x = current_row[chart.settings.xName];
                    current_y = current_row[chart.settings.yName];
                    if (chart.groupObjs.hasOwnProperty(current_x)) {
                        chart.groupObjs[current_x].values.push(current_y);
                    }
                    else {
                        chart.groupObjs[current_x] = {};
                        chart.groupObjs[current_x].values = [current_y];
                    }
                }
                for (var cName in chart.groupObjs) {
                    chart.groupObjs[cName].values.sort(d3.ascending);
                    chart.groupObjs[cName].metrics = {};
                    chart.groupObjs[cName].metrics = calcMetrics(chart.groupObjs[cName].values);
                }
                return true;
            }();
            /**
             * Prepare the chart settings and chart div and svg
             */
            !function prepareSettings() {
                //Set base settings
                chart.margin = chart.settings.margin;
                chart.divWidth = chart.settings.chartSize.width;
                chart.divHeight = chart.settings.chartSize.height;
                chart.width = chart.divWidth - chart.margin.left - chart.margin.right;
                chart.height = chart.divHeight - chart.margin.top - chart.margin.bottom;
                if (chart.settings.axisLabels) {
                    chart.xAxisLable = chart.settings.axisLabels.xAxis;
                    chart.yAxisLable = chart.settings.axisLabels.yAxis;
                }
                else {
                    chart.xAxisLable = chart.settings.xName;
                    chart.yAxisLable = chart.settings.yName;
                }
                if (chart.settings.scale === 'log') {
                    chart.yScale = d3.scale.log();
                    chart.yFormatter = D3.logFormatNumber;
                }
                else {
                    chart.yScale = d3.scale.linear();
                }
                if (chart.settings.constrainExtremes === true) {
                    var fences = [];
                    for (var cName in chart.groupObjs) {
                        fences.push(chart.groupObjs[cName].metrics.lowerInnerFence);
                        fences.push(chart.groupObjs[cName].metrics.upperInnerFence);
                    }
                    chart.range = d3.extent(fences);
                }
                else {
                    chart.range = d3.extent(chart.data, function (d) { return d[chart.settings.yName]; });
                }
                chart.colorFunct = chart.getColorFunct(chart.settings.colors);
                // Build Scale functions
                chart.yScale.range([chart.height, 0]).domain(chart.range).nice().clamp(true);
                chart.xScale = d3.scale.ordinal().domain(Object.keys(chart.groupObjs)).rangeBands([0, chart.width]);
                //Build Axes Functions
                chart.objs.yAxis = d3.svg.axis()
                    .scale(chart.yScale)
                    .orient("left")
                    .tickFormat(chart.yFormatter)
                    .outerTickSize(0)
                    .innerTickSize(-chart.width + (chart.margin.right + chart.margin.left));
                chart.objs.yAxis.ticks(chart.objs.yAxis.ticks() * chart.settings.yTicks);
                chart.objs.xAxis = d3.svg.axis().scale(chart.xScale).orient("bottom").tickSize(5);
                return true;
            }();
            /**
             * Prepare the chart html elements
             */
            !function prepareChart() {
                var settings = chart.settings;
                // Build main div and chart div
                chart.objs.mainDiv = d3.select(settings.selector)
                    .style("max-width", chart.divWidth + "px");
                // Add all the divs to make it centered and responsive
                chart.objs.mainDiv.append("div")
                    .attr("class", "inner-wrapper")
                    .style("padding-bottom", (chart.divHeight / chart.divWidth) * 100 + "%")
                    .append("div").attr("class", "outer-box")
                    .append("div").attr("class", "inner-box");
                // Capture the inner div for the chart (where the chart actually is)
                chart.selector = settings.selector + " .inner-box";
                chart.objs.chartDiv = d3.select(chart.selector);
                d3.select(window).on('resize.' + chart.selector, chart.update);
                // Create the svg
                chart.objs.g = chart.objs.chartDiv.append("svg")
                    .attr("class", "chart-area")
                    .attr("id", settings.chartId)
                    .attr("width", chart.width + (chart.margin.left + chart.margin.right))
                    .attr("height", chart.height + (chart.margin.top + chart.margin.bottom))
                    .append("g")
                    .attr("transform", "translate(" + chart.margin.left + "," + chart.margin.top + ")");
                // Create axes
                chart.objs.axes = chart.objs.g.append("g").attr("class", "axis");
                chart.objs.axes.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + chart.height + ")")
                    .call(chart.objs.xAxis);
                chart.objs.axes.append("g")
                    .attr("class", "y axis")
                    .call(chart.objs.yAxis)
                    .append("text")
                    .attr("class", "label")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -42)
                    .attr("x", -chart.height / 2)
                    .attr("dy", ".71em")
                    .style("text-anchor", "middle")
                    .text(chart.yAxisLable);
                // Create tooltip div
                chart.objs.tooltip = chart.objs.mainDiv.append('div').attr('class', 'tooltip');
                for (var cName in chart.groupObjs) {
                    chart.groupObjs[cName].g = chart.objs.g.append("g").attr("class", "group");
                    chart.groupObjs[cName].g.on("mouseover", function () {
                        chart.objs.tooltip
                            .style("display", null)
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");
                    }).on("mouseout", function () {
                        chart.objs.tooltip.style("display", "none");
                    }).on("mousemove", chart.tooltipHover(cName, chart.groupObjs[cName].metrics));
                }
                chart.update();
                return true;
            }();
            return chart;
        }
        app.init = init;
    })(app = D3.app || (D3.app = {}));
})(D3 || (D3 = {}));
/// <reference path="../../../build/linq.d.ts" />
/// <reference path="chart.ts" />
/// <reference path="appInit.ts" />
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
function makeDistroChart(settings) {
    // Defaults
    var defaultSettings = {
        data: null,
        xName: null,
        yName: null,
        selector: null,
        axisLabels: null,
        yTicks: 1,
        scale: 'linear',
        chartSize: { width: 800, height: 400 },
        margin: { top: 15, right: 60, bottom: 40, left: 50 },
        constrainExtremes: false,
        color: d3.scale.category10(),
        chartId: "DistroChart"
    };
    for (var setting in settings) {
        defaultSettings[setting] = settings[setting];
    }
    return D3.app.init(new D3.Chart(defaultSettings));
}
var D3;
(function (D3) {
    function formatAsFloat(d) {
        if (d % 1 !== 0) {
            return d3.format(".2f")(d);
        }
        else {
            return d3.format(".0f")(d);
        }
    }
    D3.formatAsFloat = formatAsFloat;
    function logFormatNumber(d) {
        var x = Math.log(d) / Math.log(10) + 1e-6;
        return Math.abs(x - Math.floor(x)) < 0.6 ? formatAsFloat(d) : "";
    }
    D3.logFormatNumber = logFormatNumber;
    /**
     * Adds jitter to the  scatter point plot
     *
     * @param doJitter true or false, add jitter to the point
     * @param width percent of the range band to cover with the jitter
     * @returns {number}
     */
    function addJitter(doJitter, width) {
        if (doJitter !== true || width == 0) {
            return 0;
        }
        return Math.floor(Math.random() * width) - width / 2;
    }
    D3.addJitter = addJitter;
    function kernelDensityEstimator(kernel, x) {
        return function (sample) {
            return x.map(function (x) {
                return { x: x, y: d3.mean(sample, function (v) { return kernel(x - v); }) };
            });
        };
    }
    D3.kernelDensityEstimator = kernelDensityEstimator;
    function eKernel(scale) {
        return function (u) {
            return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
        };
    }
    D3.eKernel = eKernel;
    // Used to find the roots for adjusting violin axis
    // Given an array, find the value for a single point, even if it is not in the domain
    function eKernelTest(kernel, array) {
        return function (testX) {
            return d3.mean(array, function (v) { return kernel(testX - v); });
        };
    }
    D3.eKernelTest = eKernelTest;
})(D3 || (D3 = {}));
/// <reference path="../../../build/svg.d.ts" />
var D3;
(function (D3) {
    var canvas;
    (function (canvas) {
        var Plot = /** @class */ (function () {
            function Plot() {
            }
            return Plot;
        }());
        canvas.Plot = Plot;
    })(canvas = D3.canvas || (D3.canvas = {}));
})(D3 || (D3 = {}));
/// <reference path="Plot.ts" />
var D3;
(function (D3) {
    var canvas;
    (function (canvas) {
        var boxPlot = /** @class */ (function (_super) {
            __extends(boxPlot, _super);
            function boxPlot(chart, options) {
                var _this = _super.call(this) || this;
                _this.chart = chart;
                _this.bOpts = $ts.clone(boxPlot.defaultOptions);
                for (var option in options) {
                    _this.bOpts[option] = options[option];
                }
                //Create box plot objects
                for (var cName in chart.groupObjs) {
                    chart.groupObjs[cName].boxPlot = {};
                    chart.groupObjs[cName].boxPlot.objs = {};
                }
                _this.bOpts.colors = chart.colorFunct;
                _this.calcAllOutliers();
                _this.prepareBoxPlot();
                _this.hookEvt();
                _this.update();
                return _this;
            }
            boxPlot.prototype.hookEvt = function () {
                d3.select(window).on('resize.' + this.chart.selector + '.boxPlot', this.update);
            };
            /**
             * Calculates all the outlier points for each group
             */
            boxPlot.prototype.calcAllOutliers = function () {
                /**
                 * Create lists of the outliers for each content group
                 * @param cGroup The object to modify
                 * @return null Modifies the object in place
                 */
                function calcOutliers(cGroup) {
                    var cExtremes = [];
                    var cOutliers = [];
                    var cOut, idx;
                    for (idx = 0; idx <= cGroup.values.length; idx++) {
                        cOut = { value: cGroup.values[idx] };
                        if (cOut.value < cGroup.metrics.lowerInnerFence) {
                            if (cOut.value < cGroup.metrics.lowerOuterFence) {
                                cExtremes.push(cOut);
                            }
                            else {
                                cOutliers.push(cOut);
                            }
                        }
                        else if (cOut.value > cGroup.metrics.upperInnerFence) {
                            if (cOut.value > cGroup.metrics.upperOuterFence) {
                                cExtremes.push(cOut);
                            }
                            else {
                                cOutliers.push(cOut);
                            }
                        }
                    }
                    cGroup.boxPlot.objs.outliers = cOutliers;
                    cGroup.boxPlot.objs.extremes = cExtremes;
                }
                for (var cName in this.chart.groupObjs) {
                    calcOutliers(this.chart.groupObjs[cName]);
                }
            };
            ;
            /**
             * Take updated options and redraw the box plot
             * @param updateOptions
             */
            boxPlot.prototype.change = function (updateOptions) {
                var bOpts = this.bOpts;
                if (updateOptions) {
                    for (var key in updateOptions) {
                        bOpts[key] = updateOptions[key];
                    }
                }
                for (var cName in this.chart.groupObjs) {
                    this.chart.groupObjs[cName].boxPlot.objs.g.remove();
                }
                this.prepareBoxPlot();
                this.update();
            };
            ;
            boxPlot.prototype.reset = function () {
                this.change(boxPlot.defaultOptions);
            };
            ;
            boxPlot.prototype.show = function (opts) {
                if (opts !== undefined) {
                    opts.show = true;
                    if (opts.reset) {
                        this.reset();
                    }
                }
                else {
                    opts = { show: true };
                }
                this.change(opts);
            };
            ;
            boxPlot.prototype.hide = function (opts) {
                if (opts !== undefined) {
                    opts.show = false;
                    if (opts.reset) {
                        this.reset();
                    }
                }
                else {
                    opts = { show: false };
                }
                this.change(opts);
            };
            ;
            /**
             * Update the box plot obj values
             */
            boxPlot.prototype.update = function () {
                var cName, cBoxPlot;
                var chart = this.chart;
                var bOpts = this.bOpts;
                for (cName in chart.groupObjs) {
                    cBoxPlot = chart.groupObjs[cName].boxPlot;
                    // Get the box width
                    var objBounds = chart.getObjWidth(bOpts.boxWidth, cName);
                    var width = (objBounds.right - objBounds.left);
                    //temp var for scaled (plottable) metric values
                    var sMetrics = {};
                    for (var attr in chart.groupObjs[cName].metrics) {
                        sMetrics[attr] = null;
                        sMetrics[attr] = chart.yScale(chart.groupObjs[cName].metrics[attr]);
                    }
                    // Box
                    if (cBoxPlot.objs.box) {
                        cBoxPlot.objs.box
                            .attr("x", objBounds.left)
                            .attr('width', width)
                            .attr("y", sMetrics.quartile3)
                            .attr("rx", 1)
                            .attr("ry", 1)
                            .attr("height", -sMetrics.quartile3 + sMetrics.quartile1);
                    }
                    // Lines
                    var lineBounds = null;
                    if (bOpts.lineWidth) {
                        lineBounds = chart.getObjWidth(bOpts.lineWidth, cName);
                    }
                    else {
                        lineBounds = objBounds;
                    }
                    // --Whiskers
                    if (cBoxPlot.objs.upperWhisker) {
                        cBoxPlot.objs.upperWhisker.fence
                            .attr("x1", lineBounds.left)
                            .attr("x2", lineBounds.right)
                            .attr('y1', sMetrics.upperInnerFence)
                            .attr("y2", sMetrics.upperInnerFence);
                        cBoxPlot.objs.upperWhisker.line
                            .attr("x1", lineBounds.middle)
                            .attr("x2", lineBounds.middle)
                            .attr('y1', sMetrics.quartile3)
                            .attr("y2", sMetrics.upperInnerFence);
                        cBoxPlot.objs.lowerWhisker.fence
                            .attr("x1", lineBounds.left)
                            .attr("x2", lineBounds.right)
                            .attr('y1', sMetrics.lowerInnerFence)
                            .attr("y2", sMetrics.lowerInnerFence);
                        cBoxPlot.objs.lowerWhisker.line
                            .attr("x1", lineBounds.middle)
                            .attr("x2", lineBounds.middle)
                            .attr('y1', sMetrics.quartile1)
                            .attr("y2", sMetrics.lowerInnerFence);
                    }
                    // --Median
                    if (cBoxPlot.objs.median) {
                        cBoxPlot.objs.median.line
                            .attr("x1", lineBounds.left)
                            .attr("x2", lineBounds.right)
                            .attr('y1', sMetrics.median)
                            .attr("y2", sMetrics.median);
                        cBoxPlot.objs.median.circle
                            .attr("cx", lineBounds.middle)
                            .attr("cy", sMetrics.median);
                    }
                    // --Mean
                    if (cBoxPlot.objs.mean) {
                        cBoxPlot.objs.mean.line
                            .attr("x1", lineBounds.left)
                            .attr("x2", lineBounds.right)
                            .attr('y1', sMetrics.mean)
                            .attr("y2", sMetrics.mean);
                        cBoxPlot.objs.mean.circle
                            .attr("cx", lineBounds.middle)
                            .attr("cy", sMetrics.mean);
                    }
                    // Outliers
                    var pt;
                    if (cBoxPlot.objs.outliers) {
                        for (pt in cBoxPlot.objs.outliers) {
                            cBoxPlot.objs.outliers[pt].point
                                .attr("cx", objBounds.middle + D3.addJitter(bOpts.scatterOutliers, width))
                                .attr("cy", chart.yScale(cBoxPlot.objs.outliers[pt].value));
                        }
                    }
                    if (cBoxPlot.objs.extremes) {
                        for (pt in cBoxPlot.objs.extremes) {
                            cBoxPlot.objs.extremes[pt].point
                                .attr("cx", objBounds.middle + D3.addJitter(bOpts.scatterOutliers, width))
                                .attr("cy", chart.yScale(cBoxPlot.objs.extremes[pt].value));
                        }
                    }
                }
            };
            ;
            /**
             * Create the svg elements for the box plot
             */
            boxPlot.prototype.prepareBoxPlot = function () {
                var cName, cBoxPlot;
                var bOpts = this.bOpts;
                var chart = this.chart;
                if (bOpts.colors) {
                    this.colorFunct = chart.getColorFunct(bOpts.colors);
                }
                else {
                    this.colorFunct = chart.colorFunct;
                }
                if (bOpts.show == false) {
                    return;
                }
                for (cName in chart.groupObjs) {
                    cBoxPlot = chart.groupObjs[cName].boxPlot;
                    cBoxPlot.objs.g = chart.groupObjs[cName].g.append("g").attr("class", "box-plot");
                    //Plot Box (default show)
                    if (bOpts.showBox) {
                        cBoxPlot.objs.box = cBoxPlot.objs.g.append("rect")
                            .attr("class", "box")
                            .style("fill", this.colorFunct(cName))
                            .style("stroke", this.colorFunct(cName));
                        //A stroke is added to the box with the group color, it is
                        // hidden by default and can be shown through css with stroke-width
                    }
                    //Plot Median (default show)
                    if (bOpts.showMedian) {
                        cBoxPlot.objs.median = { line: null, circle: null };
                        cBoxPlot.objs.median.line = cBoxPlot.objs.g.append("line")
                            .attr("class", "median");
                        cBoxPlot.objs.median.circle = cBoxPlot.objs.g.append("circle")
                            .attr("class", "median")
                            .attr('r', bOpts.medianCSize)
                            .style("fill", this.colorFunct(cName));
                    }
                    // Plot Mean (default no plot)
                    if (bOpts.showMean) {
                        cBoxPlot.objs.mean = { line: null, circle: null };
                        cBoxPlot.objs.mean.line = cBoxPlot.objs.g.append("line")
                            .attr("class", "mean");
                        cBoxPlot.objs.mean.circle = cBoxPlot.objs.g.append("circle")
                            .attr("class", "mean")
                            .attr('r', bOpts.medianCSize)
                            .style("fill", this.colorFunct(cName));
                    }
                    // Plot Whiskers (default show)
                    if (bOpts.showWhiskers) {
                        cBoxPlot.objs.upperWhisker = { fence: null, line: null };
                        cBoxPlot.objs.lowerWhisker = { fence: null, line: null };
                        cBoxPlot.objs.upperWhisker.fence = cBoxPlot.objs.g.append("line")
                            .attr("class", "upper whisker")
                            .style("stroke", this.colorFunct(cName));
                        cBoxPlot.objs.upperWhisker.line = cBoxPlot.objs.g.append("line")
                            .attr("class", "upper whisker")
                            .style("stroke", this.colorFunct(cName));
                        cBoxPlot.objs.lowerWhisker.fence = cBoxPlot.objs.g.append("line")
                            .attr("class", "lower whisker")
                            .style("stroke", this.colorFunct(cName));
                        cBoxPlot.objs.lowerWhisker.line = cBoxPlot.objs.g.append("line")
                            .attr("class", "lower whisker")
                            .style("stroke", this.colorFunct(cName));
                    }
                    // Plot outliers (default show)
                    if (bOpts.showOutliers) {
                        if (!cBoxPlot.objs.outliers)
                            this.calcAllOutliers();
                        var pt;
                        if (cBoxPlot.objs.outliers.length) {
                            var outDiv = cBoxPlot.objs.g.append("g").attr("class", "boxplot outliers");
                            for (pt in cBoxPlot.objs.outliers) {
                                cBoxPlot.objs.outliers[pt].point = outDiv.append("circle")
                                    .attr("class", "outlier")
                                    .attr('r', bOpts.outlierCSize)
                                    .style("fill", this.colorFunct(cName));
                            }
                        }
                        if (cBoxPlot.objs.extremes.length) {
                            var extDiv = cBoxPlot.objs.g.append("g").attr("class", "boxplot extremes");
                            for (pt in cBoxPlot.objs.extremes) {
                                cBoxPlot.objs.extremes[pt].point = extDiv.append("circle")
                                    .attr("class", "extreme")
                                    .attr('r', bOpts.outlierCSize)
                                    .style("stroke", this.colorFunct(cName));
                            }
                        }
                    }
                }
            };
            ;
            // Defaults
            boxPlot.defaultOptions = {
                show: true,
                showBox: true,
                showWhiskers: true,
                showMedian: true,
                showMean: false,
                medianCSize: 3.5,
                showOutliers: true,
                boxWidth: 30,
                lineWidth: null,
                scatterOutliers: false,
                outlierCSize: 2.5,
                colors: null
            };
            return boxPlot;
        }(canvas.Plot));
        canvas.boxPlot = boxPlot;
    })(canvas = D3.canvas || (D3.canvas = {}));
})(D3 || (D3 = {}));
var D3;
(function (D3) {
    var canvas;
    (function (canvas) {
        var dataPlot = /** @class */ (function (_super) {
            __extends(dataPlot, _super);
            function dataPlot(chart, options) {
                var _this = _super.call(this) || this;
                _this.chart = chart;
                _this.dOpts = $ts.clone(dataPlot.defaultOptions);
                /**
                 * The lines don't fit into a group bucket so they live under the dataPlot object
                */
                _this.objs = {
                    g: null,
                    lines: null
                };
                for (var option in options) {
                    _this.dOpts[option] = options[option];
                }
                //Create notch objects
                for (var cName in chart.groupObjs) {
                    chart.groupObjs[cName].dataPlots = {};
                    chart.groupObjs[cName].dataPlots.objs = {};
                }
                _this.preparePlots();
                _this.hookEvt();
                _this.update();
                return _this;
            }
            /**
             * Take updated options and redraw the data plots
             * @param updateOptions
             */
            dataPlot.prototype.change = function (updateOptions) {
                var dOpts = this.dOpts;
                if (updateOptions) {
                    for (var key in updateOptions) {
                        dOpts[key] = updateOptions[key];
                    }
                }
                this.objs.g.remove();
                for (var cName in this.chart.groupObjs) {
                    this.chart.groupObjs[cName].dataPlots.objs.g.remove();
                }
                this.preparePlots();
                this.update();
            };
            ;
            dataPlot.prototype.reset = function () {
                this.change(dataPlot.defaultOptions);
            };
            ;
            dataPlot.prototype.show = function (opts) {
                if (opts !== undefined) {
                    opts.show = true;
                    if (opts.reset) {
                        this.reset();
                    }
                }
                else {
                    opts = { show: true };
                }
                this.change(opts);
            };
            ;
            dataPlot.prototype.hide = function (opts) {
                if (opts !== undefined) {
                    opts.show = false;
                    if (opts.reset) {
                        this.reset();
                    }
                }
                else {
                    opts = { show: false };
                }
                this.change(opts);
            };
            ;
            /**
             * Update the data plot obj values
             */
            dataPlot.prototype.update = function () {
                var cName, cGroup, cPlot;
                var chart = this.chart;
                var dOpts = this.dOpts;
                // Metrics lines
                if (this.objs.g) {
                    var halfBand = chart.xScale.rangeBand() / 2; // find the middle of each band
                    for (var cMetric in this.objs.lines) {
                        this.objs.lines[cMetric].line
                            .x(function (d) {
                            return chart.xScale(d.x) + halfBand;
                        });
                        this.objs.lines[cMetric].g
                            .datum(this.objs.lines[cMetric].values)
                            .attr('d', this.objs.lines[cMetric].line);
                    }
                }
                for (cName in chart.groupObjs) {
                    cGroup = chart.groupObjs[cName];
                    cPlot = cGroup.dataPlots;
                    if (cPlot.objs.points) {
                        if (dOpts.plotType == 'beeswarm') {
                            var swarmBounds = chart.getObjWidth(100, cName);
                            var yPtScale = chart.yScale.copy()
                                .range([Math.floor(chart.yScale.range()[0] / dOpts.pointSize), 0])
                                .interpolate(d3.interpolateRound)
                                .domain(chart.yScale.domain());
                            var maxWidth = Math.floor(chart.xScale.rangeBand() / dOpts.pointSize);
                            var ptsObj = {};
                            var cYBucket = null;
                            //  Bucket points
                            for (var pt = 0; pt < cGroup.values.length; pt++) {
                                cYBucket = yPtScale(cGroup.values[pt]);
                                if (ptsObj.hasOwnProperty(cYBucket) !== true) {
                                    ptsObj[cYBucket] = [];
                                }
                                ptsObj[cYBucket].push(cPlot.objs.points.pts[pt]
                                    .attr("cx", swarmBounds.middle)
                                    .attr("cy", yPtScale(cGroup.values[pt]) * dOpts.pointSize));
                            }
                            //  Plot buckets
                            var rightMax = Math.min(swarmBounds.right - dOpts.pointSize);
                            for (var row in ptsObj) {
                                var leftMin = swarmBounds.left + (Math.max((maxWidth - ptsObj[row].length) / 2, 0) * dOpts.pointSize);
                                var col = 0;
                                for (var pt_1 in ptsObj[row]) {
                                    ptsObj[row][pt_1].attr("cx", Math.min(leftMin + col * dOpts.pointSize, rightMax) + dOpts.pointSize / 2);
                                    col++;
                                }
                            }
                        }
                        else { // For scatter points and points with no scatter
                            var plotBounds = null, scatterWidth = 0, width = 0;
                            if (dOpts.plotType == 'scatter' || typeof dOpts.plotType == 'number') {
                                //Default scatter percentage is 20% of box width
                                scatterWidth = typeof dOpts.plotType == 'number' ? dOpts.plotType : 20;
                            }
                            plotBounds = chart.getObjWidth(scatterWidth, cName);
                            width = plotBounds.right - plotBounds.left;
                            for (var pt = 0; pt < cGroup.values.length; pt++) {
                                cPlot.objs.points.pts[pt]
                                    .attr("cx", plotBounds.middle + D3.addJitter(true, width))
                                    .attr("cy", chart.yScale(cGroup.values[pt]));
                            }
                        }
                    }
                    if (cPlot.objs.bean) {
                        var beanBounds = chart.getObjWidth(dOpts.beanWidth, cName);
                        for (var pt = 0; pt < cGroup.values.length; pt++) {
                            cPlot.objs.bean.lines[pt]
                                .attr("x1", beanBounds.left)
                                .attr("x2", beanBounds.right)
                                .attr('y1', chart.yScale(cGroup.values[pt]))
                                .attr("y2", chart.yScale(cGroup.values[pt]));
                        }
                    }
                }
            };
            ;
            /**
             * Create the svg elements for the data plots
             */
            dataPlot.prototype.preparePlots = function () {
                var cName, cPlot;
                var dOpts = this.dOpts;
                if (dOpts && dOpts.colors) {
                    this.colorFunct = this.chart.getColorFunct(dOpts.colors);
                }
                else {
                    this.colorFunct = this.chart.colorFunct;
                }
                if (dOpts.show == false) {
                    return;
                }
                // Metrics lines
                this.objs.g = this.chart.objs.g.append("g").attr("class", "metrics-lines");
                if (dOpts.showLines && dOpts.showLines.length > 0) {
                    var cMetric;
                    var chart = this.chart;
                    this.objs.lines = {};
                    for (var line in dOpts.showLines) {
                        cMetric = dOpts.showLines[line];
                        this.objs.lines[cMetric] = {};
                        this.objs.lines[cMetric].values = [];
                        for (var cGroup in this.chart.groupObjs) {
                            this.objs.lines[cMetric].values.push({
                                x: cGroup,
                                y: this.chart.groupObjs[cGroup].metrics[cMetric]
                            });
                        }
                        this.objs.lines[cMetric].line = d3.svg.line()
                            .interpolate("cardinal")
                            .y(function (d) {
                            return chart.yScale(d.y);
                        });
                        this.objs.lines[cMetric].g = this.objs.g.append("path")
                            .attr("class", "line " + cMetric)
                            .attr("data-metric", cMetric)
                            .style("fill", 'none')
                            .style("stroke", this.chart.colorFunct(cMetric));
                    }
                }
                for (cName in this.chart.groupObjs) {
                    cPlot = this.chart.groupObjs[cName].dataPlots;
                    cPlot.objs.g = this.chart.groupObjs[cName].g.append("g").attr("class", "data-plot");
                    // Points Plot
                    if (dOpts.showPlot) {
                        cPlot.objs.points = { g: null, pts: [] };
                        cPlot.objs.points.g = cPlot.objs.g.append("g").attr("class", "points-plot");
                        for (var pt = 0; pt < this.chart.groupObjs[cName].values.length; pt++) {
                            cPlot.objs.points.pts.push(cPlot.objs.points.g.append("circle")
                                .attr("class", "point")
                                .attr('r', dOpts.pointSize / 2) // Options is diameter, r takes radius so divide by 2
                                .style("fill", this.colorFunct(cName)));
                        }
                    }
                    // Bean lines
                    if (dOpts.showBeanLines) {
                        cPlot.objs.bean = { g: null, lines: [] };
                        cPlot.objs.bean.g = cPlot.objs.g.append("g").attr("class", "bean-plot");
                        for (var pt = 0; pt < this.chart.groupObjs[cName].values.length; pt++) {
                            cPlot.objs.bean.lines.push(cPlot.objs.bean.g.append("line")
                                .attr("class", "bean line")
                                .style("stroke-width", '1')
                                .style("stroke", this.colorFunct(cName)));
                        }
                    }
                }
            };
            ;
            dataPlot.prototype.hookEvt = function () {
                d3.select(window).on('resize.' + this.chart.selector + '.dataPlot', this.update);
            };
            //Defaults
            dataPlot.defaultOptions = {
                show: true,
                showPlot: false,
                plotType: 'none',
                pointSize: 6,
                showLines: false,
                showBeanLines: false,
                beanWidth: 20,
                colors: null
            };
            return dataPlot;
        }(canvas.Plot));
        canvas.dataPlot = dataPlot;
    })(canvas = D3.canvas || (D3.canvas = {}));
})(D3 || (D3 = {}));
var D3;
(function (D3) {
    var canvas;
    (function (canvas) {
        var notchBoxes = /** @class */ (function (_super) {
            __extends(notchBoxes, _super);
            function notchBoxes(chart, options) {
                var _this = _super.call(this) || this;
                _this.chart = chart;
                _this.nOpts = $ts.clone(notchBoxes.defaultOptions);
                for (var option in options) {
                    _this.nOpts[option] = options[option];
                }
                //Create notch objects
                for (var cName in chart.groupObjs) {
                    chart.groupObjs[cName].notchBox = {};
                    chart.groupObjs[cName].notchBox.objs = {};
                }
                /**
                 * Calculate the confidence intervals
                */
                !function calcNotches() {
                    var cNotch, modifier;
                    for (var cName in chart.groupObjs) {
                        cNotch = chart.groupObjs[cName];
                        modifier = (1.57 * (cNotch.metrics.iqr / Math.sqrt(cNotch.values.length)));
                        cNotch.metrics.upperNotch = cNotch.metrics.median + modifier;
                        cNotch.metrics.lowerNotch = cNotch.metrics.median - modifier;
                    }
                    return true;
                }();
                _this.prepareNotchBoxes();
                _this.hookEvt();
                _this.update();
                return _this;
            }
            /**
             * Makes the svg path string for a notched box
             * @param cNotch Current notch box object
             * @param notchBounds objBound object
             * @returns {string} A string in the proper format for a svg polygon
             */
            notchBoxes.prototype.makeNotchBox = function (cNotch, notchBounds) {
                var scaledValues = [];
                var nOpts = this.nOpts;
                var chart = this.chart;
                if (nOpts.notchStyle == 'box') {
                    scaledValues = [
                        [notchBounds.boxLeft, chart.yScale(cNotch.metrics.quartile1)],
                        [notchBounds.boxLeft, chart.yScale(cNotch.metrics.lowerNotch)],
                        [notchBounds.medianLeft, chart.yScale(cNotch.metrics.lowerNotch)],
                        [notchBounds.medianLeft, chart.yScale(cNotch.metrics.median)],
                        [notchBounds.medianLeft, chart.yScale(cNotch.metrics.upperNotch)],
                        [notchBounds.boxLeft, chart.yScale(cNotch.metrics.upperNotch)],
                        [notchBounds.boxLeft, chart.yScale(cNotch.metrics.quartile3)],
                        [notchBounds.boxRight, chart.yScale(cNotch.metrics.quartile3)],
                        [notchBounds.boxRight, chart.yScale(cNotch.metrics.upperNotch)],
                        [notchBounds.medianRight, chart.yScale(cNotch.metrics.upperNotch)],
                        [notchBounds.medianRight, chart.yScale(cNotch.metrics.median)],
                        [notchBounds.medianRight, chart.yScale(cNotch.metrics.lowerNotch)],
                        [notchBounds.boxRight, chart.yScale(cNotch.metrics.lowerNotch)],
                        [notchBounds.boxRight, chart.yScale(cNotch.metrics.quartile1)]
                    ];
                }
                else {
                    scaledValues = [
                        [notchBounds.boxLeft, chart.yScale(cNotch.metrics.quartile1)],
                        [notchBounds.boxLeft, chart.yScale(cNotch.metrics.lowerNotch)],
                        [notchBounds.medianLeft, chart.yScale(cNotch.metrics.median)],
                        [notchBounds.boxLeft, chart.yScale(cNotch.metrics.upperNotch)],
                        [notchBounds.boxLeft, chart.yScale(cNotch.metrics.quartile3)],
                        [notchBounds.boxRight, chart.yScale(cNotch.metrics.quartile3)],
                        [notchBounds.boxRight, chart.yScale(cNotch.metrics.upperNotch)],
                        [notchBounds.medianRight, chart.yScale(cNotch.metrics.median)],
                        [notchBounds.boxRight, chart.yScale(cNotch.metrics.lowerNotch)],
                        [notchBounds.boxRight, chart.yScale(cNotch.metrics.quartile1)]
                    ];
                }
                return scaledValues.map(function (d) {
                    return [d[0], d[1]].join(",");
                }).join(" ");
            };
            /**
             * Take a new set of options and redraw the notch boxes
             * @param updateOptions
             */
            notchBoxes.prototype.change = function (updateOptions) {
                var nOpts = this.nOpts;
                var chart = this.chart;
                if (updateOptions) {
                    for (var key in updateOptions) {
                        nOpts[key] = updateOptions[key];
                    }
                }
                for (var cName in chart.groupObjs) {
                    chart.groupObjs[cName].notchBox.objs.g.remove();
                }
                this.prepareNotchBoxes();
                this.update();
            };
            ;
            notchBoxes.prototype.reset = function () {
                this.change(notchBoxes.defaultOptions);
            };
            ;
            notchBoxes.prototype.show = function (opts) {
                if (opts !== undefined) {
                    opts.show = true;
                    if (opts.reset) {
                        this.reset();
                    }
                }
                else {
                    opts = { show: true };
                }
                this.change(opts);
            };
            ;
            notchBoxes.prototype.hide = function (opts) {
                if (opts !== undefined) {
                    opts.show = false;
                    if (opts.reset) {
                        this.reset();
                    }
                }
                else {
                    opts = { show: false };
                }
                this.change(opts);
            };
            ;
            /**
             * Update the notch box obj values
             */
            notchBoxes.prototype.update = function () {
                var cName, cGroup;
                var chart = this.chart;
                var nOpts = this.nOpts;
                for (cName in chart.groupObjs) {
                    cGroup = chart.groupObjs[cName];
                    // Get the box size
                    var boxBounds = chart.getObjWidth(nOpts.boxWidth, cName);
                    var medianBounds = chart.getObjWidth(nOpts.medianWidth, cName);
                    var notchBounds = {
                        boxLeft: boxBounds.left,
                        boxRight: boxBounds.right,
                        middle: boxBounds.middle,
                        medianLeft: medianBounds.left,
                        medianRight: medianBounds.right
                    };
                    // Notch Box
                    if (cGroup.notchBox.objs.notch) {
                        cGroup.notchBox.objs.notch
                            .attr("points", this.makeNotchBox(cGroup, notchBounds));
                    }
                    if (cGroup.notchBox.objs.upperLine) {
                        var lineBounds = null;
                        if (nOpts.lineWidth) {
                            lineBounds = chart.getObjWidth(nOpts.lineWidth, cName);
                        }
                        else {
                            lineBounds = {
                                left: 1,
                                right: 1,
                                middle: 1
                            };
                        }
                        var confidenceLines = {
                            upper: chart.yScale(cGroup.metrics.upperNotch),
                            lower: chart.yScale(cGroup.metrics.lowerNotch)
                        };
                        cGroup.notchBox.objs.upperLine
                            .attr("x1", lineBounds.left)
                            .attr("x2", lineBounds.right)
                            .attr('y1', confidenceLines.upper)
                            .attr("y2", confidenceLines.upper);
                        cGroup.notchBox.objs.lowerLine
                            .attr("x1", lineBounds.left)
                            .attr("x2", lineBounds.right)
                            .attr('y1', confidenceLines.lower)
                            .attr("y2", confidenceLines.lower);
                    }
                }
            };
            ;
            /**
             * Create the svg elements for the notch boxes
             */
            notchBoxes.prototype.prepareNotchBoxes = function () {
                var cName, cNotch;
                var nOpts = this.nOpts;
                var chart = this.chart;
                if (nOpts && nOpts.colors) {
                    this.colorFunct = this.chart.getColorFunct(nOpts.colors);
                }
                else {
                    this.colorFunct = this.chart.colorFunct;
                }
                if (nOpts.show == false) {
                    return;
                }
                for (cName in chart.groupObjs) {
                    cNotch = chart.groupObjs[cName].notchBox;
                    cNotch.objs.g = chart.groupObjs[cName].g.append("g").attr("class", "notch-plot");
                    // Plot Box (default show)
                    if (nOpts.showNotchBox) {
                        cNotch.objs.notch = cNotch.objs.g.append("polygon")
                            .attr("class", "notch")
                            .style("fill", this.colorFunct(cName))
                            .style("stroke", this.colorFunct(cName));
                        //A stroke is added to the notch with the group color, it is
                        // hidden by default and can be shown through css with stroke-width
                    }
                    //Plot Confidence Lines (default hide)
                    if (nOpts.showLines) {
                        cNotch.objs.upperLine = cNotch.objs.g.append("line")
                            .attr("class", "upper confidence line")
                            .style("stroke", this.colorFunct(cName));
                        cNotch.objs.lowerLine = cNotch.objs.g.append("line")
                            .attr("class", "lower confidence line")
                            .style("stroke", this.colorFunct(cName));
                    }
                }
            };
            ;
            notchBoxes.prototype.hookEvt = function () {
                d3.select(window).on('resize.' + this.chart.selector + '.notchBox', this.update);
            };
            //Defaults
            notchBoxes.defaultOptions = {
                show: true,
                showNotchBox: true,
                showLines: false,
                boxWidth: 35,
                medianWidth: 20,
                lineWidth: 50,
                notchStyle: null,
                colors: null
            };
            return notchBoxes;
        }(canvas.Plot));
        canvas.notchBoxes = notchBoxes;
    })(canvas = D3.canvas || (D3.canvas = {}));
})(D3 || (D3 = {}));
/// <reference path="Plot.ts" />
var D3;
(function (D3) {
    var canvas;
    (function (canvas) {
        var violinPlot = /** @class */ (function (_super) {
            __extends(violinPlot, _super);
            function violinPlot(chart, options) {
                var _this = _super.call(this) || this;
                _this.chart = chart;
                _this.vOpts = $ts.clone(violinPlot.defaultOptions);
                for (var option in options) {
                    _this.vOpts[option] = options[option];
                }
                // Create violin plot objects
                for (var cName in chart.groupObjs) {
                    chart.groupObjs[cName].violin = {};
                    chart.groupObjs[cName].violin.objs = {};
                }
                _this.vOpts.colors = chart.colorFunct;
                _this.prepareViolin();
                _this.hookEvt();
                _this.update();
                return _this;
            }
            violinPlot.prototype.hookEvt = function () {
                d3.select(window).on('resize.' + this.chart.selector + '.violinPlot', this.update);
            };
            /**
             * Take a new set of options and redraw the violin
             * @param updateOptions
            */
            violinPlot.prototype.change = function (updateOptions) {
                if (updateOptions) {
                    for (var key in updateOptions) {
                        this.vOpts[key] = updateOptions[key];
                    }
                }
                for (var cName in this.chart.groupObjs) {
                    this.chart.groupObjs[cName].violin.objs.g.remove();
                }
                this.prepareViolin();
                this.update();
            };
            ;
            violinPlot.prototype.reset = function () {
                this.change(violinPlot.defaultOptions);
            };
            ;
            violinPlot.prototype.show = function (opts) {
                if (opts !== undefined) {
                    opts.show = true;
                    if (opts.reset) {
                        this.reset();
                    }
                }
                else {
                    opts = { show: true };
                }
                this.change(opts);
            };
            ;
            violinPlot.prototype.hide = function (opts) {
                if (opts !== undefined) {
                    opts.show = false;
                    if (opts.reset) {
                        this.reset();
                    }
                }
                else {
                    opts = { show: false };
                }
                this.change(opts);
            };
            ;
            /**
             * Update the violin obj values
             */
            violinPlot.prototype.update = function () {
                var cName, cViolinPlot;
                var vm = this.chart;
                var vOpts = this.vOpts;
                for (cName in vm.groupObjs) {
                    cViolinPlot = vm.groupObjs[cName].violin;
                    // Build the violins sideways, so use the yScale for the xScale and make a new yScale
                    var xVScale = vm.yScale.copy();
                    // Create the Kernel Density Estimator Function
                    cViolinPlot.kde = D3.kernelDensityEstimator(D3.eKernel(vOpts.bandwidth), xVScale.ticks(vOpts.resolution));
                    cViolinPlot.kdedata = cViolinPlot.kde(vm.groupObjs[cName].values);
                    var interpolateMax = vm.groupObjs[cName].metrics.max, interpolateMin = vm.groupObjs[cName].metrics.min;
                    if (vOpts.clamp == 0 || vOpts.clamp == -1) { //
                        // When clamp is 0, calculate the min and max that is needed to bring the violin plot to a point
                        // interpolateMax = the Minimum value greater than the max where y = 0
                        interpolateMax = d3.min(cViolinPlot.kdedata.filter(function (d) {
                            return (d.x > vm.groupObjs[cName].metrics.max && d.y == 0);
                        }), function (d) {
                            return d.x;
                        });
                        // interpolateMin = the Maximum value less than the min where y = 0
                        interpolateMin = d3.max(cViolinPlot.kdedata.filter(function (d) {
                            return (d.x < vm.groupObjs[cName].metrics.min && d.y == 0);
                        }), function (d) {
                            return d.x;
                        });
                        // If clamp is -1 we need to extend the axises so that the violins come to a point
                        if (vOpts.clamp == -1) {
                            var kdeTester = D3.eKernelTest(D3.eKernel(vOpts.bandwidth), vm.groupObjs[cName].values);
                            if (!interpolateMax) {
                                var interMaxY = kdeTester(vm.groupObjs[cName].metrics.max);
                                var interMaxX = vm.groupObjs[cName].metrics.max;
                                var count = 25; // Arbitrary limit to make sure we don't get an infinite loop
                                while (count > 0 && interMaxY != 0) {
                                    interMaxY = kdeTester(interMaxX);
                                    interMaxX += 1;
                                    count -= 1;
                                }
                                interpolateMax = interMaxX;
                            }
                            if (!interpolateMin) {
                                var interMinY = kdeTester(vm.groupObjs[cName].metrics.min);
                                var interMinX = vm.groupObjs[cName].metrics.min;
                                var count = 25; // Arbitrary limit to make sure we don't get an infinite loop
                                while (count > 0 && interMinY != 0) {
                                    interMinY = kdeTester(interMinX);
                                    interMinX -= 1;
                                    count -= 1;
                                }
                                interpolateMin = interMinX;
                            }
                        }
                        // Check to see if the new values are outside the existing chart range
                        //   If they are assign them to the master _yDomainVP
                        if (!vOpts._yDomainVP)
                            vOpts._yDomainVP = vm.range.slice(0);
                        if (interpolateMin && interpolateMin < vOpts._yDomainVP[0]) {
                            vOpts._yDomainVP[0] = interpolateMin;
                        }
                        if (interpolateMax && interpolateMax > vOpts._yDomainVP[1]) {
                            vOpts._yDomainVP[1] = interpolateMax;
                        }
                    }
                    if (vOpts.showViolinPlot) {
                        vm.update();
                        xVScale = vm.yScale.copy();
                        // Need to recalculate the KDE because the xVScale changed
                        cViolinPlot.kde = D3.kernelDensityEstimator(D3.eKernel(vOpts.bandwidth), xVScale.ticks(vOpts.resolution));
                        cViolinPlot.kdedata = cViolinPlot.kde(vm.groupObjs[cName].values);
                    }
                    cViolinPlot.kdedata = cViolinPlot.kdedata
                        .filter(function (d) {
                        return (!interpolateMin || d.x >= interpolateMin);
                    })
                        .filter(function (d) {
                        return (!interpolateMax || d.x <= interpolateMax);
                    });
                }
                for (cName in vm.groupObjs) {
                    cViolinPlot = vm.groupObjs[cName].violin;
                    // Get the violin width
                    var objBounds = vm.getObjWidth(vOpts.width, cName);
                    var width = (objBounds.right - objBounds.left) / 2;
                    var yVScale = d3.scale.linear()
                        .range([width, 0])
                        .domain([0, d3.max(cViolinPlot.kdedata, function (d) { return d.y; })])
                        .clamp(true);
                    var area = d3.svg.area()
                        .interpolate(vOpts.interpolation)
                        .x(function (d) { return xVScale(d.x); })
                        .y0(width)
                        .y1(function (d) { return yVScale(d.y); });
                    var line = d3.svg.line()
                        .interpolate(vOpts.interpolation)
                        .x(function (d) { return xVScale(d.x); })
                        .y(function (d) { return yVScale(d.y); });
                    if (cViolinPlot.objs.left.area) {
                        cViolinPlot.objs.left.area
                            .datum(cViolinPlot.kdedata)
                            .attr("d", area);
                        cViolinPlot.objs.left.line
                            .datum(cViolinPlot.kdedata)
                            .attr("d", line);
                        cViolinPlot.objs.right.area
                            .datum(cViolinPlot.kdedata)
                            .attr("d", area);
                        cViolinPlot.objs.right.line
                            .datum(cViolinPlot.kdedata)
                            .attr("d", line);
                    }
                    // Rotate the violins
                    cViolinPlot.objs.left.g.attr("transform", "rotate(90,0,0)   translate(0,-" + objBounds.left + ")  scale(1,-1)");
                    cViolinPlot.objs.right.g.attr("transform", "rotate(90,0,0)  translate(0,-" + objBounds.right + ")");
                }
            };
            ;
            /**
             * Create the svg elements for the violin plot
             */
            violinPlot.prototype.prepareViolin = function () {
                var cName, cViolinPlot;
                var vm = this.chart;
                var vOpts = this.vOpts;
                if (vOpts.colors) {
                    this.colorFunct = vm.getColorFunct(vOpts.colors);
                }
                else {
                    this.colorFunct = vm.colorFunct;
                }
                if (vOpts.show == false) {
                    return;
                }
                for (cName in vm.groupObjs) {
                    cViolinPlot = vm.groupObjs[cName].violin;
                    cViolinPlot.objs.g = vm.groupObjs[cName].g.append("g").attr("class", "violin-plot");
                    cViolinPlot.objs.left = { area: null, line: null, g: null };
                    cViolinPlot.objs.right = { area: null, line: null, g: null };
                    cViolinPlot.objs.left.g = cViolinPlot.objs.g.append("g");
                    cViolinPlot.objs.right.g = cViolinPlot.objs.g.append("g");
                    if (vOpts.showViolinPlot !== false) {
                        //Area
                        cViolinPlot.objs.left.area = cViolinPlot.objs.left.g.append("path")
                            .attr("class", "area")
                            .style("fill", this.colorFunct(cName));
                        cViolinPlot.objs.right.area = cViolinPlot.objs.right.g.append("path")
                            .attr("class", "area")
                            .style("fill", this.colorFunct(cName));
                        //Lines
                        cViolinPlot.objs.left.line = cViolinPlot.objs.left.g.append("path")
                            .attr("class", "line")
                            .attr("fill", 'none')
                            .style("stroke", this.colorFunct(cName));
                        cViolinPlot.objs.right.line = cViolinPlot.objs.right.g.append("path")
                            .attr("class", "line")
                            .attr("fill", 'none')
                            .style("stroke", this.colorFunct(cName));
                    }
                }
            };
            ;
            violinPlot.defaultOptions = {
                show: true,
                showViolinPlot: true,
                resolution: 100,
                bandwidth: 20,
                width: 50,
                interpolation: 'cardinal',
                clamp: 1,
                colors: null,
                _yDomainVP: null // If the Violin plot is set to close all violin plots, it may need to extend the domain, that extended domain is stored here
            };
            return violinPlot;
        }(canvas.Plot));
        canvas.violinPlot = violinPlot;
    })(canvas = D3.canvas || (D3.canvas = {}));
})(D3 || (D3 = {}));
//# sourceMappingURL=science.chartkit.js.map