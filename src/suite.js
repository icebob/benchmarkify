const kleur = require("kleur");
const _ = require("lodash");
const humanize = require("tiny-human-time");

const TestCase = require("./testcase");

/**
 * Formatting number
 *
 * @param {any} value Number value
 * @param {number} [decimals=0] Count of decimals
 * @param {boolean} [sign=false] Put '+' sign if the number is positive
 * @returns
 */
function formatNumber(value, decimals = 0, sign = false) {
	let res = Number(value.toFixed(decimals)).toLocaleString();
	if (sign && value > 0.0) res = "+" + res;
	return res;
}

function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 *
 *
 * @class Suite
 */
class Suite {
	/**
	 * Creates an instance of Suite.
	 * @param {Benchmarkify} parent
	 * @param {String} name
	 * @param {Object} opts
	 *
	 * @memberOf Suite
	 */
	constructor(parent, name, opts = {}) {
		this.parent = parent;
		this.name = name;
		this.description = opts.description;
		this.meta = opts.meta || {};
		this.unit = opts.unit || "ops/sec";
		this.logger = this.parent.logger;
		this.onlyTest = null;
		this.done = false;
		this.running = false;
		this.locals = {};

		this.tests = [];

		_.defaultsDeep(this, opts, {
			time: 5000,
			minSamples: 0
		});

		if (!this.cycles) this.cycles = this.minSamples > 0 ? this.minSamples : 1000;
	}

	/**
	 * Add a "setup" function to be run before test.
	 * 
	 * @param {Function} fn
	 */
	setup(fn) {
		this.setupFn = fn;
		return this;
	}

	/**
	 * Add a "tearDown" function to be run after test.
	 * 
	 * @param {Function} fn
	 */
	tearDown(fn) {
		this.tearDownFn = fn;
		return this;
	}

	/**
	 *
	 *
	 * @param {any} name
	 * @param {any} fn
	 * @param {any} opts
	 * @returns
	 *
	 * @memberOf Suite
	 */
	appendTest(name, fn, opts) {
		const test = new TestCase(this, name, fn, opts);
		this.tests.push(test);
		return test;
	}

	/**
	 *
	 *
	 * @param {any} name
	 * @param {any} fn
	 * @param {any} [opts={}]
	 * @returns
	 *
	 * @memberOf Suite
	 */
	add(name, fn, opts = {}) {
		this.appendTest(name, fn, opts);
		return this;
	}

	/**
	 *
	 *
	 * @param {any} name
	 * @param {any} fn
	 * @param {any} [opts={}]
	 * @returns
	 *
	 * @memberOf Suite
	 */
	only(name, fn, opts = {}) {
		this.onlyTest = this.appendTest(name, fn, opts);
		return this;
	}

	/**
	 *
	 *
	 * @param {any} name
	 * @param {any} fn
	 * @param {any} [opts={}]
	 * @returns
	 *
	 * @memberOf Suite
	 */
	skip(name, fn, opts = {}) {
		const test = this.appendTest(name, fn, opts);
		test.skip = true;

		return this;
	}

	/**
	 *
	 *
	 * @param {any} name
	 * @param {any} fn
	 * @param {any} [opts={}]
	 * @returns
	 *
	 * @memberOf Suite
	 */
	ref(name, fn, opts = {}) {
		const test = this.appendTest(name, fn, opts);
		test.reference = true;

		return this;
	}

	/**
	 *
	 *
	 * @returns
	 *
	 * @memberOf Suite
	 */
	run() {
		const self = this;
		self.maxTitleLength =
			this.tests.reduce((max, test) => Math.max(max, test.name.length), 0) + 2;

		if (this.onlyTest) {
			this.tests.forEach(test => (test.skip = test !== this.onlyTest));
		}

		return Promise.resolve()
			.then(() => {
				if (_.isFunction(self.setupFn)) return self.setupFn.call(self);
				else if (Array.isArray(self.setupFn))
					return Promise.all(self.setupFn.map(fn => fn.call(self)));
			})
			.then(() => {
				return new Promise(resolve => {
					self.running = true;

					const suiteTitle = `Suite: ${self.name}`;
					self.logger.log(kleur.magenta().bold(suiteTitle));
					self.logger.log(kleur.magenta().bold("=".repeat(suiteTitle.length)));
					self.logger.log("");

					this.runTest(Array.from(this.tests), resolve);
				});
			})
			.then(() => {
				if (_.isFunction(self.tearDownFn)) return self.tearDownFn.call(self);
				else if (Array.isArray(self.tearDownFn))
					return Promise.all(self.tearDownFn.map(fn => fn.call(self)));
			})
			.then(() => {
				if (self.parent.spinner) self.parent.spinner.stop();

				self.logger.log("");

				// Generate results
				return self.calculateResult();
			});
	}

	/**
	 *
	 *
	 * @param {any} list
	 * @param {any} resolve
	 * @returns
	 *
	 * @memberOf Suite
	 */
	runTest(list, resolve) {
		const self = this;
		const test = list.shift();

		function printAndRun(type, msg, err) {
			if (self.parent.spinner) self.parent.spinner[type](msg);
			else self.logger.log("››", msg);

			if (err) self.logger.error(err);

			return list.length > 0 ? self.runTest(list, resolve) : resolve();
		}

		if (test.skip) {
			// Skip test
			return printAndRun("warn", kleur.yellow(`[SKIP] ${test.name}`));
		}

		if (this.parent.spinner) {
			// Refresh spinner
			self.parent.spinner.text = `Running '${test.name}'...`;
			self.parent.spinner.start();
		}

		// Run test
		return test
			.run()
			.then(() => delay(200))
			.then(() => {
				const flag = test.async ? "*" : "";
				const msg =
					_.padEnd(test.name + flag, self.maxTitleLength) +
					_.padStart(formatNumber(test.stat.rps) + " " + self.unit, 20);
				return printAndRun("succeed", msg);
			})
			.catch(err => {
				test.error = err;
				return printAndRun("fail", kleur.red("[ERR] " + test.name), err);
			});
	}

	/**
	 *
	 *
	 * @returns
	 *
	 * @memberOf Suite
	 */
	calculateResult() {
		let maxRps = 0;
		let maxTitleLength = 0;
		let fastest = null;
		let reference = null;
		this.tests.forEach(test => {
			if (test.skip) return;

			if (test.reference) reference = test;

			if (test.stat.rps > maxRps) {
				maxRps = test.stat.rps;
				fastest = test;
			}

			if (test.name.length > maxTitleLength) maxTitleLength = test.name.length;
		});

		//this.tests.sort((a, b) => b.stat.rps - a.stat.rps);

		const pe = _.padEnd;
		const ps = _.padStart;

		this.tests.forEach(test => {
			if (test.skip) {
				this.logger.log(kleur.yellow(`   ${test.name} (skipped)`));
				return;
			}
			if (test.error) {
				this.logger.log(kleur.red(`   ${test.name} (error: ${test.error.message})`));
				return;
			}
			const baseRps = reference ? reference.stat.rps : fastest.stat.rps;
			const c = test == fastest ? kleur.green() : kleur.cyan();
			test.stat.percent = (test.stat.rps / baseRps) * 100 - 100;
			let flag = test.async ? "*" : "";
			if (test == reference) flag += " (#)";

			const line = [
				"  ",
				pe(test.name + flag, maxTitleLength + 5),
				ps(formatNumber(test.stat.percent, 2, true) + "%", 8),
				ps("  (" + formatNumber(test.stat.rps) + " " + this.unit + ")", 20),
				"  (avg: " + humanize.short(test.stat.avg * 1000) + ")"
			];
			this.logger.log(c.bold(line.join(" ")));
		});
		this.logger.log(
			"-----------------------------------------------------------------------\n"
		);

		// Generate result to return
		const result = this.tests.map(test => {
			const item = {
				name: test.name,
				meta: test.meta || {},
				unit: this.unit,
			};

			if (test === fastest) item.fastest = true;

			if (test.reference) item.reference = true;

			if (test.error) item.error = test.error.toString();

			if (!test.skip) item.stat = test.stat;
			else item.skipped = true;

			return item;
		});

		return result;
	}
}

module.exports = Suite;