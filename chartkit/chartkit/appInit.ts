namespace D3.app {

    function calcMetrics(values: number[]) {
        var metrics: canvas.metrics = <any>{};

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

        return metrics
    }

    export function init(chart: Chart): Chart {

        console.dir(chart);

        /**
         * Parse the data and calculates base values for the plots
        */
        !function prepareData() {
            var current_x = null;
            var current_y = null;

            // Group the values
            for (let current_row of chart.data) {
                current_x = current_row[chart.settings.xName];
                current_y = current_row[chart.settings.yName];

                if (chart.groupObjs.hasOwnProperty(current_x)) {
                    chart.groupObjs[current_x].values.push(current_y);
                } else {
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
            } else {
                chart.xAxisLable = chart.settings.xName;
                chart.yAxisLable = chart.settings.yName;
            }

            if (chart.settings.scale === 'log') {
                chart.yScale = d3.scale.log();
                chart.yFormatter = D3.logFormatNumber;
            } else {
                chart.yScale = d3.scale.linear();
            }

            if (chart.settings.constrainExtremes === true) {
                var fences = [];
                for (var cName in chart.groupObjs) {
                    fences.push(chart.groupObjs[cName].metrics.lowerInnerFence);
                    fences.push(chart.groupObjs[cName].metrics.upperInnerFence);
                }
                chart.range = d3.extent(fences);

            } else {
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
            // Build main div and chart div
            chart.objs.mainDiv = d3.select(chart.settings.selector)
                .style("max-width", chart.divWidth + "px");
            // Add all the divs to make it centered and responsive
            chart.objs.mainDiv.append("div")
                .attr("class", "inner-wrapper")
                .style("padding-bottom", (chart.divHeight / chart.divWidth) * 100 + "%")
                .append("div").attr("class", "outer-box")
                .append("div").attr("class", "inner-box");
            // Capture the inner div for the chart (where the chart actually is)
            chart.selector = chart.settings.selector + " .inner-box";
            chart.objs.chartDiv = d3.select(chart.selector);
            d3.select(window).on('resize.' + chart.selector, chart.update);

            // Create the svg
            chart.objs.g = chart.objs.chartDiv.append("svg")
                .attr("class", "chart-area")
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
                        .style("left", ((<page><any>d3.event).pageX) + "px")
                        .style("top", ((<page><any>d3.event).pageY - 28) + "px");
                }).on("mouseout", function () {
                    chart.objs.tooltip.style("display", "none");
                }).on("mousemove", chart.tooltipHover(cName, chart.groupObjs[cName].metrics))
            }
            chart.update();

            return true;
        }();

        return chart;
    }

    interface page {
        pageX: number;
        pageY: number;
    }
}