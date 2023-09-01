const ora = require("ora");
const kleur = require("kleur");

const Suite = require("./suite");

/**
 *
 *
 * @class Benchmarkify
 */
class Benchmarkify {
	/**
	 * Creates an instance of Benchmarkify.
	 * @param {any} name
	 * @param {any} logger
	 *
	 * @memberOf Benchmarkify
	 */
	constructor(name, opts = {}) {
		this.name = name;
		this.description = opts.description;
		this.meta = opts.meta || {};
		this.logger = opts.logger || console;
		this.chartImage = opts.chartImage;
		this.drawChart = opts.drawChart != null ? opts.drawChart : true;
		if (opts.spinner !== false) {
			this.spinner = ora({
				text: "Running benchmark...",
				spinner: {
					interval: 400,
					frames: [".  ", ".. ", "...", " ..", "  .", "   "]
				}
			});
		}

		this.Promise = Promise;

		this.suites = [];
	}

	/**
	 *
	 *
	 *
	 * @memberOf Benchmarkify
	 */
	printPlatformInfo() {
		require("./platform")(this.logger);
		this.logger.log("");
	}

	/**
	 *
	 *
	 * @param {boolean} [platformInfo=true]
	 *
	 * @memberOf Benchmarkify
	 */
	printHeader(platformInfo = true) {
		const title = "  " + this.name + "  ";
		const lines = "=".repeat(title.length);
		this.logger.log(kleur.yellow().bold(lines));
		this.logger.log(kleur.yellow().bold(title));
		this.logger.log(kleur.yellow().bold(lines));
		this.logger.log("");

		if (platformInfo) this.printPlatformInfo();

		return this;
	}

	/**
	 *
	 *
	 * @param {String} name
	 * @param {any} opts
	 * @returns
	 *
	 * @memberOf Benchmarkify
	 */
	createSuite(name, opts) {
		const suite = new Suite(this, name, opts);
		this.suites.push(suite);
		return suite;
	}

	/**
	 *
	 *
	 * @param {any} suites
	 * @returns
	 *
	 * @memberOf Benchmarkify
	 */
	run(suites) {
		const self = this;
		const list = Array.from(suites || this.suites);
		const results = [];
		const start = Date.now();

		/**
		 *
		 *
		 * @param {any} suite
		 * @returns
		 */
		function run(suite) {
			return suite.run().then(res => {
				results.push(res);

				if (list.length > 0) return run(list.shift());

				return {
					name: self.name,
					description: self.description,
					meta: self.meta,
					suites: results,
					timestamp: Date.now(),
					generated: new Date().toString(),
					elapsedMs: Date.now() - start,
				};
			});
		}

		return run(list.shift());
	}
}

module.exports = Benchmarkify;