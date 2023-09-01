const qs = require("qs");
const _ = require("lodash");

module.exports = {
	generateChartImageUrl(suite, opts) {

		// opts = opts || { params: {} };

		const params = {
			chs: "999x500",
			chtt: `${suite.name}|(${suite.unit})`,
			chf: "b0,lg,90,03a9f4,0,3f51b5,1",
			chg: "0,50",
			chma: "0,0,10,10",
			cht: "bvs",
			chxt: "x,y",
			chxs: "0,333,10|1,333,10",

			chxl: "0:|" + suite.tests.map(s => s.name).join("|"),
			chd: "a:" + suite.tests.map(s => s.stat.rps).join(",")
		};

		return `https://image-charts.com/chart?${qs.stringify(params)}`;
	},

	generateChartJSImageUrl(suite, opts) {
		opts = opts || {};

		const params = {
			bkg: opts.backgroundColor || "white",
			c: JSON.stringify(_.defaultsDeep(opts.chartOptions, {
				"type": "bar",
				"data": {
					"labels": suite.tests.map(s => s.name),
					"datasets": [
						{
							"label": "Dataset 1",
							"backgroundColor": "rgba(54, 162, 235, 0.5)",
							"borderColor": "rgb(54, 162, 235)",
							"borderWidth": 1,
							"data": suite.tests.map(s => s.stat.rps)
						}
					]
				},
				"options": {
					"responsive": false,
					"legend": {
						"display": false,
						"position": "top"
					},
					"title": {
						"display": true,
						"text": `${suite.name}|(${suite.unit})`
					},
					layout: {
						padding: 20
					}
				}
			}))
		};

		if (opts.width) params.width = opts.width / 2;
		if (opts.height) params.height = opts.height / 2;

		return `https://image-charts.com/chart.js/2.8.0?${qs.stringify(params)}`;
	}
};