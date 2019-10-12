namespace D3.canvas {

    export interface notchBoxesOptions extends PlotOptions {
        showNotchBox: boolean
        showLines: boolean
        boxWidth: number
        medianWidth: number
        lineWidth: number
        notchStyle: string
    }

    export class notchBoxes extends Plot {

        //Defaults
        static readonly defaultOptions = <notchBoxesOptions>{
            show: true,
            showNotchBox: true,
            showLines: false,
            boxWidth: 35,
            medianWidth: 20,
            lineWidth: 50,
            notchStyle: null,
            colors: null
        };

        private nOpts = $ts.clone(notchBoxes.defaultOptions);
        private metrics: metrics;

        public constructor(public chart: Chart, options: notchBoxesOptions) {
            super();

            for (var option in options) {
                this.nOpts[option] = options[option]
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

            this.prepareNotchBoxes();
            this.hookEvt();
            this.update();
        }
        /**
         * Makes the svg path string for a notched box
         * @param cNotch Current notch box object
         * @param notchBounds objBound object
         * @returns {string} A string in the proper format for a svg polygon
         */
        private makeNotchBox(cNotch: notchBoxes, notchBounds) {
            var scaledValues = [];
            var nOpts = this.nOpts;
            let chart = this.chart;

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
            } else {
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
        }



        /**
         * Take a new set of options and redraw the notch boxes
         * @param updateOptions
         */
        change(updateOptions) {
            let nOpts = this.nOpts;
            let chart = this.chart;

            if (updateOptions) {
                for (var key in updateOptions) {
                    nOpts[key] = updateOptions[key]
                }
            }

            for (var cName in chart.groupObjs) {
                chart.groupObjs[cName].notchBox.objs.g.remove()
            }
            this.prepareNotchBoxes();
            this.update();
        };

        reset() {
            this.change(notchBoxes.defaultOptions)
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
         * Update the notch box obj values
         */
        update() {
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
                        lineBounds = chart.getObjWidth(nOpts.lineWidth, cName)
                    } else {
                        lineBounds = objBounds
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

        /**
         * Create the svg elements for the notch boxes
         */
        prepareNotchBoxes() {
            var cName, cNotch;
            var nOpts = this.nOpts;
            var chart = this.chart;

            if (nOpts && nOpts.colors) {
                this.colorFunct = this.chart.getColorFunct(nOpts.colors);
            } else {
                this.colorFunct = this.chart.colorFunct
            }

            if (nOpts.show == false) {
                return
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

        protected hookEvt() {
            d3.select(window).on('resize.' + this.chart.selector + '.notchBox', this.update);
        }

    }
}