/// <reference path="Plot.ts" />

namespace D3.canvas {

    export interface boxPlotOptions extends PlotOptions {
        showBox: boolean
        showWhiskers: boolean
        showMedian: boolean
        showMean: boolean
        medianCSize: number
        showOutliers: boolean
        boxWidth: number 
        lineWidth: number
        scatterOutliers: boolean
        outlierCSize: number
    }

    export class boxPlot extends Plot {

        // Defaults
        static readonly defaultOptions = <boxPlotOptions>{
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

        public bOpts = $ts.clone(boxPlot.defaultOptions);

        public constructor(public chart: Chart, options: boxPlotOptions) {
            super();

            for (var option in options) {
                this.bOpts[option] = options[option]
            }
            
            //Create box plot objects
            for (var cName in chart.groupObjs) {
                chart.groupObjs[cName].boxPlot = {};
                chart.groupObjs[cName].boxPlot.objs = {};
            }

            this.bOpts.colors = chart.colorFunct;
            this.calcAllOutliers();
            this.prepareBoxPlot();
            this.hookEvt();
            this.update();
        }

        protected hookEvt() {
            d3.select(window).on('resize.' + this.chart.selector + '.boxPlot', this.update);
        }

        /**
         * Calculates all the outlier points for each group
         */
        private calcAllOutliers() {

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
                        } else {
                            cOutliers.push(cOut);
                        }
                    } else if (cOut.value > cGroup.metrics.upperInnerFence) {
                        if (cOut.value > cGroup.metrics.upperOuterFence) {
                            cExtremes.push(cOut);
                        } else {
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

        /**
         * Take updated options and redraw the box plot
         * @param updateOptions
         */
        change(updateOptions) {
            let bOpts =  this.bOpts;

            if (updateOptions) {
                for (var key in updateOptions) {
                    bOpts[key] = updateOptions[key]
                }
            }

            for (var cName in this.chart.groupObjs) {
                this.chart.groupObjs[cName].boxPlot.objs.g.remove()
            }
            this.prepareBoxPlot();
            this.update()
        };

        reset() {
            this.change(boxPlot. defaultOptions)
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
         * Update the box plot obj values
         */
        update() {
            var cName, cBoxPlot;
            var chart = this.chart;
            var bOpts = this.bOpts;

            for (cName in chart.groupObjs) {
                cBoxPlot = chart.groupObjs[cName].boxPlot;

                // Get the box width
                var objBounds = chart . getObjWidth(bOpts.boxWidth, cName);
                var width = (objBounds.right - objBounds.left);

                //temp var for scaled (plottable) metric values
                var sMetrics : metrics =<any> {}; 
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
                        .attr("height", -sMetrics.quartile3 + sMetrics.quartile1)
                }

                // Lines
                var lineBounds = null;
                if (bOpts.lineWidth) {
                    lineBounds =chart . getObjWidth(bOpts.lineWidth, cName)
                } else {
                    lineBounds = objBounds
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
                        .attr("cy", sMetrics.median)
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
                            .attr("cx", objBounds.middle + addJitter(bOpts.scatterOutliers, width))
                            .attr("cy", chart.yScale(cBoxPlot.objs.outliers[pt].value));
                    }
                }
                if (cBoxPlot.objs.extremes) {
                    for (pt in cBoxPlot.objs.extremes) {
                        cBoxPlot.objs.extremes[pt].point
                            .attr("cx", objBounds.middle + addJitter(bOpts.scatterOutliers, width))
                            .attr("cy", chart.yScale(cBoxPlot.objs.extremes[pt].value));
                    }
                }
            }
        };

        /**
         * Create the svg elements for the box plot
         */
        prepareBoxPlot() {
            var cName, cBoxPlot;
            var bOpts = this.bOpts;
            var chart = this.chart;

            if (bOpts.colors) {
                this.colorFunct = chart.getColorFunct(bOpts.colors);
            } else {
                this.colorFunct = chart.colorFunct
            }

            if (bOpts.show == false) {
                return
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
                    if (!cBoxPlot.objs.outliers) this.calcAllOutliers();
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

    }
}