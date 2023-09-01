const kleur = require("kleur");
const _ = require("lodash");
const r = _.repeat;

module.exports = {
	drawChart(logger, suite, opts) {
		const maxTestNameLen = Math.max(...suite.tests.map(s => s.name.length));
		const maxRps = Math.max(...suite.tests.map(s => s.stat.rps));
		const chartWidth = 50;

		const w = maxTestNameLen + chartWidth + 5;

		logger.info(kleur.grey("┌" + r("─", maxTestNameLen + 2) + "┬" + r("─", w - maxTestNameLen - 3) + "┐"));

		suite.tests.forEach((test, i) => {
			let str = test.name + r(" ", maxTestNameLen - test.name.length + 1);
			str += kleur.grey("│ ");
			const percent = maxRps > 0 ? test.stat.rps / maxRps : 0;
			const len = Math.round(chartWidth * percent);
			str += r("█", len);
			// str += r("░", chartWidth - len);
			str += r(" ", chartWidth - len);

			logger.info(kleur.grey("│ ") + str + kleur.grey(" │"));

			if (i < suite.tests.length - 1) {
				logger.info(kleur.grey("├" + r("─", maxTestNameLen + 2) + "┼" + r("─", w - maxTestNameLen - 3) + "┤"));
			}
		});

		logger.info(kleur.grey("└" + r("─", maxTestNameLen + 2) + "┴" + r("─", w - maxTestNameLen - 3) + "┘"));
	}
};