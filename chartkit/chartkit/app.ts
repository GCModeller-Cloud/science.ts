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
function makeDistroChart(settings: D3.settings): D3.Chart {
    // Defaults
    let defaultSettings = <D3.settings>{
        data: null,
        xName: null,
        yName: null,
        selector: null,
        axisLables: null,
        yTicks: 1,
        scale: 'linear',
        chartSize: { width: 800, height: 400 },
        margin: { top: 15, right: 60, bottom: 40, left: 50 },
        constrainExtremes: false,
        color: d3.scale.category10()
    };

    for (var setting in settings) {
        defaultSettings[setting] = settings[setting]
    }

    return D3.app.init(new D3.Chart(settings));
}