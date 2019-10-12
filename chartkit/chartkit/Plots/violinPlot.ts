/// <reference path="Plot.ts" />

namespace D3.canvas {

    export interface violinPlotOptions extends PlotOptions {
        /**
         * If the Violin plot is set to close all violin plots, it may 
         * need to extend the domain, that extended domain is stored 
         * here
        */
        _yDomainVP: {}
        showViolinPlot: boolean
        resolution: number
        bandwidth: number
        width: number
        interpolation: string
        clamp: number
    }

    export class violinPlot extends Plot {

        static readonly defaultOptions = <violinPlotOptions>{
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

        public vOpts = $ts.clone(violinPlot.defaultOptions);

        public constructor(public chart: Chart, options: any) {
            super();

            for (var option in options) {
                this.vOpts[option] = options[option]
            }

            // Create violin plot objects
            for (var cName in chart.groupObjs) {
                chart.groupObjs[cName].violin = {};
                chart.groupObjs[cName].violin.objs = {};
            }

            this.vOpts.colors = chart.colorFunct;
            this.prepareViolin();
            this.hookEvt();
            this.update();
        }

        protected hookEvt() {
            d3.select(window).on('resize.' + this.chart.selector + '.violinPlot', this.update);
        }

        /**
         * Take a new set of options and redraw the violin
         * @param updateOptions
        */
        change(updateOptions) {
            if (updateOptions) {
                for (var key in updateOptions) {
                    this.vOpts[key] = updateOptions[key]
                }
            }

            for (var cName in this.chart.groupObjs) {
                this.chart.groupObjs[cName].violin.objs.g.remove()
            }

            this.prepareViolin();
            this.update();
        };

        reset() {
            this.change(violinPlot.defaultOptions)
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
            this.change(opts);
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
            this.change(opts);
        };

        /**
         * Update the violin obj values
         */
        update() {
            let cName, cViolinPlot;
            let vm = this.chart;
            let vOpts = this.vOpts;

            for (cName in vm.groupObjs) {
                cViolinPlot = vm.groupObjs[cName].violin;

                // Build the violins sideways, so use the yScale for the xScale and make a new yScale
                var xVScale = vm.yScale.copy();


                // Create the Kernel Density Estimator Function
                cViolinPlot.kde = kernelDensityEstimator(eKernel(vOpts.bandwidth), xVScale.ticks(vOpts.resolution));
                cViolinPlot.kdedata = cViolinPlot.kde(vm.groupObjs[cName].values);

                var interpolateMax = vm.groupObjs[cName].metrics.max,
                    interpolateMin = vm.groupObjs[cName].metrics.min;

                if (vOpts.clamp == 0 || vOpts.clamp == -1) { //
                    // When clamp is 0, calculate the min and max that is needed to bring the violin plot to a point
                    // interpolateMax = the Minimum value greater than the max where y = 0
                    interpolateMax = d3.min(cViolinPlot.kdedata.filter(function (d) {
                        return (d.x > vm.groupObjs[cName].metrics.max && d.y == 0)
                    }), function (d) {
                        return d.x;
                    });
                    // interpolateMin = the Maximum value less than the min where y = 0
                    interpolateMin = d3.max(cViolinPlot.kdedata.filter(function (d) {
                        return (d.x < vm.groupObjs[cName].metrics.min && d.y == 0)
                    }), function (d) {
                        return d.x;
                    });

                    // If clamp is -1 we need to extend the axises so that the violins come to a point
                    if (vOpts.clamp == -1) {
                        let kdeTester = eKernelTest(eKernel(vOpts.bandwidth), vm.groupObjs[cName].values);

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
                            var count = 25;  // Arbitrary limit to make sure we don't get an infinite loop
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
                    if (!vOpts._yDomainVP) vOpts._yDomainVP = vm.range.slice(0);
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
                    cViolinPlot.kde = kernelDensityEstimator(eKernel(vOpts.bandwidth), xVScale.ticks(vOpts.resolution));
                    cViolinPlot.kdedata = cViolinPlot.kde(vm.groupObjs[cName].values);
                }

                cViolinPlot.kdedata = cViolinPlot.kdedata
                    .filter(function (d) {
                        return (!interpolateMin || d.x >= interpolateMin)
                    })
                    .filter(function (d) {
                        return (!interpolateMax || d.x <= interpolateMax)
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
                    .y(function (d) { return yVScale(d.y) });

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

        /**
         * Create the svg elements for the violin plot
         */
        prepareViolin() {
            var cName, cViolinPlot;
            let vm = this.chart;
            let vOpts = this.vOpts;

            if (vOpts.colors) {
                this.color = vm.getColorFunct(vOpts.colors);
            } else {
                this.color = vm.colorFunct
            }

            if (vOpts.show == false) { return }

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
                        .style("fill", this.color(cName));
                    cViolinPlot.objs.right.area = cViolinPlot.objs.right.g.append("path")
                        .attr("class", "area")
                        .style("fill", this.color(cName));

                    //Lines
                    cViolinPlot.objs.left.line = cViolinPlot.objs.left.g.append("path")
                        .attr("class", "line")
                        .attr("fill", 'none')
                        .style("stroke", this.color(cName));
                    cViolinPlot.objs.right.line = cViolinPlot.objs.right.g.append("path")
                        .attr("class", "line")
                        .attr("fill", 'none')
                        .style("stroke", this.color(cName));
                }

            }

        };
    }
}