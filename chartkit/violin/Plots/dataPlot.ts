namespace D3.canvas {

    export interface dataPlotOptions extends PlotOptions {
        showPlot: boolean
        plotType: string
        pointSize: number
        showLines: boolean
        showBeanLines: boolean
        beanWidth: number
    }

    export class dataPlot extends Plot {

        //Defaults
        static readonly defaultOptions = <dataPlotOptions>{
            show: true,
            showPlot: false,
            plotType: 'none',
            pointSize: 6,
            showLines: false,//['median'],
            showBeanLines: false,
            beanWidth: 20,
            colors: null
        };

        private dOpts = $ts.clone(dataPlot.defaultOptions);

        /**
         * The lines don't fit into a group bucket so they live under the dataPlot object
        */
        private objs = {};

        public constructor(public chart: Chart, options: any) {
            super();

            for (var option in options) {
                this.dOpts[option] = options[option]
            }

            //Create notch objects
            for (var cName in chart.groupObjs) {
                chart.groupObjs[cName].dataPlots = {};
                chart.groupObjs[cName].dataPlots.objs = {};
            }

            this.preparePlots();
            this.hookEvt();
            this.update();
        }

        /**
         * Take updated options and redraw the data plots
         * @param updateOptions
         */
        change(updateOptions) {
            if (updateOptions) {
                for (var key in updateOptions) {
                    dOpts[key] = updateOptions[key]
                }
            }

            chart.dataPlots.objs.g.remove();
            for (var cName in chart.groupObjs) {
                chart.groupObjs[cName].dataPlots.objs.g.remove()
            }
            chart.dataPlots.preparePlots();
            chart.dataPlots.update()
        };

        reset() {
            chart.dataPlots.change(defaultOptions)
        };
        show(opts) {
            if (opts !== undefined) {
                opts.show = true;
                if (opts.reset) {
                    chart.dataPlots.reset()
                }
            } else {
                opts = { show: true };
            }
            chart.dataPlots.change(opts)
        };
        hide(opts) {
            if (opts !== undefined) {
                opts.show = false;
                if (opts.reset) {
                    chart.dataPlots.reset()
                }
            } else {
                opts = { show: false };
            }
            chart.dataPlots.change(opts)
        };

        /**
         * Update the data plot obj values
         */
        update() {
            var cName, cGroup, cPlot;

            // Metrics lines
            if (chart.dataPlots.objs.g) {
                var halfBand = chart.xScale.rangeBand() / 2; // find the middle of each band
                for (var cMetric in chart.dataPlots.objs.lines) {
                    chart.dataPlots.objs.lines[cMetric].line
                        .x(function (d) {
                            return chart.xScale(d.x) + halfBand
                        });
                    chart.dataPlots.objs.lines[cMetric].g
                        .datum(chart.dataPlots.objs.lines[cMetric].values)
                        .attr('d', chart.dataPlots.objs.lines[cMetric].line);
                }
            }


            for (cName in chart.groupObjs) {
                cGroup = chart.groupObjs[cName];
                cPlot = cGroup.dataPlots;

                if (cPlot.objs.points) {
                    if (dOpts.plotType == 'beeswarm') {
                        var swarmBounds = getObjWidth(100, cName);
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
                            for (pt in ptsObj[row]) {
                                ptsObj[row][pt].attr("cx", Math.min(leftMin + col * dOpts.pointSize, rightMax) + dOpts.pointSize / 2);
                                col++
                            }
                        }
                    } else { // For scatter points and points with no scatter
                        var plotBounds = null,
                            scatterWidth = 0,
                            width = 0;
                        if (dOpts.plotType == 'scatter' || typeof dOpts.plotType == 'number') {
                            //Default scatter percentage is 20% of box width
                            scatterWidth = typeof dOpts.plotType == 'number' ? dOpts.plotType : 20;
                        }

                        plotBounds = getObjWidth(scatterWidth, cName);
                        width = plotBounds.right - plotBounds.left;

                        for (var pt = 0; pt < cGroup.values.length; pt++) {
                            cPlot.objs.points.pts[pt]
                                .attr("cx", plotBounds.middle + addJitter(true, width))
                                .attr("cy", chart.yScale(cGroup.values[pt]));
                        }
                    }
                }


                if (cPlot.objs.bean) {
                    var beanBounds = getObjWidth(dOpts.beanWidth, cName);
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

        /**
         * Create the svg elements for the data plots
         */
        preparePlots() {
            var cName, cPlot;

            if (dOpts && dOpts.colors) {
                chart.dataPlots.colorFunct = getColorFunct(dOpts.colors);
            } else {
                chart.dataPlots.colorFunct = chart.colorFunct
            }

            if (dOpts.show == false) {
                return
            }

            // Metrics lines
            chart.dataPlots.objs.g = chart.objs.g.append("g").attr("class", "metrics-lines");
            if (dOpts.showLines && dOpts.showLines.length > 0) {
                chart.dataPlots.objs.lines = {};
                var cMetric;
                for (var line in dOpts.showLines) {
                    cMetric = dOpts.showLines[line];
                    chart.dataPlots.objs.lines[cMetric] = {};
                    chart.dataPlots.objs.lines[cMetric].values = [];
                    for (var cGroup in chart.groupObjs) {
                        chart.dataPlots.objs.lines[cMetric].values.push({
                            x: cGroup,
                            y: chart.groupObjs[cGroup].metrics[cMetric]
                        })
                    }
                    chart.dataPlots.objs.lines[cMetric].line = d3.svg.line()
                        .interpolate("cardinal")
                        .y(function (d) {
                            return chart.yScale(d.y)
                        });
                    chart.dataPlots.objs.lines[cMetric].g = chart.dataPlots.objs.g.append("path")
                        .attr("class", "line " + cMetric)
                        .attr("data-metric", cMetric)
                        .style("fill", 'none')
                        .style("stroke", chart.colorFunct(cMetric));
                }

            }


            for (cName in chart.groupObjs) {

                cPlot = chart.groupObjs[cName].dataPlots;
                cPlot.objs.g = chart.groupObjs[cName].g.append("g").attr("class", "data-plot");

                // Points Plot
                if (dOpts.showPlot) {
                    cPlot.objs.points = { g: null, pts: [] };
                    cPlot.objs.points.g = cPlot.objs.g.append("g").attr("class", "points-plot");
                    for (var pt = 0; pt < chart.groupObjs[cName].values.length; pt++) {
                        cPlot.objs.points.pts.push(cPlot.objs.points.g.append("circle")
                            .attr("class", "point")
                            .attr('r', dOpts.pointSize / 2)// Options is diameter, r takes radius so divide by 2
                            .style("fill", chart.dataPlots.colorFunct(cName)));
                    }
                }


                // Bean lines
                if (dOpts.showBeanLines) {
                    cPlot.objs.bean = { g: null, lines: [] };
                    cPlot.objs.bean.g = cPlot.objs.g.append("g").attr("class", "bean-plot");
                    for (var pt = 0; pt < chart.groupObjs[cName].values.length; pt++) {
                        cPlot.objs.bean.lines.push(cPlot.objs.bean.g.append("line")
                            .attr("class", "bean line")
                            .style("stroke-width", '1')
                            .style("stroke", chart.dataPlots.colorFunct(cName)));
                    }
                }
            }

        };

        protected hookEvt() {
            d3.select(window).on('resize.' + this.chart.selector + '.dataPlot', this.update);
        }


    }
}