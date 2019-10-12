namespace D3.canvas {

    export interface dataPlotOptions extends PlotOptions {
        showPlot: boolean
        plotType: string
        pointSize: number
        showLines: boolean | {}
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
        private objs = {
            g: null,
            lines: null
        };

        public constructor(public chart: Chart, options: dataPlotOptions) {
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
            let dOpts = this.dOpts;

            if (updateOptions) {
                for (var key in updateOptions) {
                    dOpts[key] = updateOptions[key]
                }
            }

            this.objs.g.remove();

            for (var cName in this.chart.groupObjs) {
                this.chart.groupObjs[cName].dataPlots.objs.g.remove()
            }

            this.preparePlots();
            this.update()
        };

        reset() {
            this.change(dataPlot.defaultOptions)
        };
        show(opts) {
            if (opts !== undefined) {
                opts.show = true;
                if (opts.reset) {
                    this.reset()
                }
            } else {
                opts = { show: true };
            }
            this.change(opts)
        };
        hide(opts) {
            if (opts !== undefined) {
                opts.show = false;
                if (opts.reset) {
                    this.reset()
                }
            } else {
                opts = { show: false };
            }
            this.change(opts)
        };

        /**
         * Update the data plot obj values
         */
        update() {
            var cName, cGroup, cPlot;
            var chart = this.chart;
            var dOpts = this.dOpts;

            // Metrics lines
            if (this.objs.g) {
                var halfBand = chart.xScale.rangeBand() / 2; // find the middle of each band
                for (var cMetric in this.objs.lines) {
                    this.objs.lines[cMetric].line
                        .x(function (d) {
                            return chart.xScale(d.x) + halfBand
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
                            for (let pt in ptsObj[row]) {
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

                        plotBounds = chart.getObjWidth(scatterWidth, cName);
                        width = plotBounds.right - plotBounds.left;

                        for (var pt = 0; pt < cGroup.values.length; pt++) {
                            cPlot.objs.points.pts[pt]
                                .attr("cx", plotBounds.middle + addJitter(true, width))
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

        /**
         * Create the svg elements for the data plots
         */
        preparePlots() {
            var cName, cPlot;
            var dOpts = this.dOpts;

            if (dOpts && dOpts.colors) {
                this.colorFunct = this.chart.getColorFunct(dOpts.colors);
            } else {
                this.colorFunct = this.chart.colorFunct
            }

            if (dOpts.show == false) {
                return
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
                        })
                    }
                    this.objs.lines[cMetric].line = d3.svg.line()
                        .interpolate("cardinal")
                        .y(function (d) {
                            return chart.yScale(d.y)
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
                            .attr('r', dOpts.pointSize / 2)// Options is diameter, r takes radius so divide by 2
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

        protected hookEvt() {
            d3.select(window).on('resize.' + this.chart.selector + '.dataPlot', this.update);
        }
    }
}