const _ = require("lodash");
const Promise = require("bluebird");
const chalk = require("chalk");
const humanize = require('tiny-human-time');

const ora = require('ora');

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
	if (sign && value > 0.0)
		res = "+" + res;
	return res;
}

/**
 * Test case class
 *
 * @class TestCase
 */
class TestCase {
	/**
	 * Creates an instance of TestCase.
	 *
	 * @param {Suite} suite
	 * @param {String} name
	 * @param {Function} fn
	 * @param {Object} opts
	 *
	 * @memberOf TestCase
	 */
	constructor(suite, name, fn, opts) {
		this.suite = suite;
		this.name = name;
		this.fn = fn;
		this.async = fn.length > 0;
		this.opts = opts || {};
		this.skip = false;
		this.done = false;
		this.running = false;
		this.time = Math.max(this.opts.time || this.suite.time || 5000, 0);
		this.cycles = Math.max(this.opts.cycles || this.suite.cycles || 1000, 0);
		this.minSamples = Math.max(this.opts.minSamples || this.suite.minSamples || 5, 0);

		this.cycleTimes = [];
		this.timer = null;
		this.startTime = null;

		this.stat = {
			duration: null,
			cycle: 0,
			count: 0,
			avg: null,
			rps: null
		};
	}

	/**
	 *
	 *
	 * @returns
	 *
	 * @memberOf TestCase
	 */
	run() {
		const self = this;
		return new Promise((resolve, reject) => {
			// Start test
			self.start();

			// Run
			if (self.async) {
				self.cyclingAsyncCb(resolve, reject);
			} else {
				self.cycling(resolve);
			}
		});
	}

	/**
	 *
	 *
	 *
	 * @memberOf TestCase
	 */
	start() {
		this.running = true;
		this.stat.count = 0;
		this.startTime = Date.now();
	}

	/**
	 *
	 *
	 *
	 * @memberOf TestCase
	 */
	finish() {
		const count = this.stat.count;
		const duration = 0
			+ this.cycleTimes.reduce((sum, [seconds]) => (sum + seconds), 0)
			+ this.cycleTimes.reduce((sum, [, nanoseconds]) => (sum + nanoseconds), 0) / 1e9;

		_.assign(this.stat, {
			duration,
			avg: duration / count,
			rps: count / duration
		});

		this.done = true;
		this.running = false;
	}

	/**
	 *
	 *
	 * @param {any} resolve
	 *
	 * @memberOf TestCase
	 */
	cycling(resolve) {
		if (
			this.stat.count < this.minSamples
			|| Date.now() - this.startTime < this.time
		) {
			const startCycle = process.hrtime();

			for (let i = this.cycles; i > 0; --i) {
				this.fn();
			}

			this.cycleTimes.push(process.hrtime(startCycle))
			this.stat.count += this.cycles;
			this.stat.cycle++;
			setImmediate(() => this.cycling(resolve));

		} else {
			this.finish();
			resolve(this);
		}
	}

	/**
	 *
	 *
	 * @param {any} resolve
	 *
	 * @memberOf TestCase
	 */
	cyclingAsyncCb(resolve) {
		const self = this;
		const fn = self.fn;

		// Start
		let counter = self.cycles;
		let startCycle = process.hrtime();
		return onCycleComplete();

		function onCycleComplete() {
			if (counter-- > 0) {
				return fn(onCycleComplete);
			}

			self.stat.count += self.cycles;
			self.cycleTimes.push(process.hrtime(startCycle));

			if (
				self.stat.count < self.minSamples
				|| Date.now() - self.startTime < self.time
			) {
				// Wait for new cycle
				setImmediate(() => {
					counter = self.cycles;
					startCycle = process.hrtime();
					fn(onCycleComplete);
				});

			} else {
				// Finished
				self.finish();
				resolve(self);
			}
		}
	}
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
	constructor(parent, name, opts) {
		this.parent = parent;
		this.name = name;
		this.logger = this.parent.logger;
		this.onlyTest = null;
		this.done = false;
		this.running = false;

		this.tests = [];

		_.assign(this, {
			time: 5000,
			minSamples: 0
		}, opts);

		if (!this.cycles)
			this.cycles = this.minSamples > 0 ? this.minSamples : 1000;
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
		let self = this;
		self.maxTitleLength = this.tests.reduce((max, test) => Math.max(max, test.name.length), 0) + 2;

		if (this.onlyTest) {
			this.tests.forEach(test => test.skip = test !== this.onlyTest);
		}

		return new Promise(resolve => {
			self.running = true;
			self.logger.log(chalk.magenta.bold(`Suite: ${self.name}`));

			this.runTest(Array.from(this.tests), resolve);

		}).then(() => {
			if (self.parent.spinner)
				self.parent.spinner.stop();

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
			if (self.parent.spinner)
				self.parent.spinner[type](msg);
			else
				self.logger.log("››", msg);

			if (err)
				self.logger.error(err);

			return list.length > 0 ? self.runTest(list, resolve) : resolve();
		}

		if (test.skip) {
			// Skip test
			return printAndRun("warn", chalk.yellow("[SKIP] " + test.name));
		}

		if (this.parent.spinner) {
			// Refresh spinner
			self.parent.spinner.text = `Running '${test.name}'...`;
			self.parent.spinner.start();
		}

		// Run test
		return test.run().delay(200).then(() => {
			const flag = test.async ? "*" : "";
			let msg = _.padEnd(test.name + flag, self.maxTitleLength) + _.padStart(formatNumber(test.stat.rps) + " rps", 20);
			return printAndRun("succeed", msg);

		}).catch(err => {
			test.error = err;
			return printAndRun("fail", chalk.red("[ERR] " + test.name), err);
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

			if (test.reference)
				reference = test;

			if (test.stat.rps > maxRps) {
				maxRps = test.stat.rps;
				fastest = test;
			}

			if (test.name.length > maxTitleLength)
				maxTitleLength = test.name.length;
		});

		//this.tests.sort((a, b) => b.stat.rps - a.stat.rps);

		let pe = _.padEnd;
		let ps = _.padStart;

		this.tests.forEach(test => {
			if (test.skip) {
				this.logger.log(chalk.yellow("  ", test.name, "(skipped)"));
				return;
			}
			if (test.error) {
				this.logger.log(chalk.red("  ", test.name, "(error: " + test.error.message + ")"));
				return;
			}
			const baseRps = reference ? reference.stat.rps : fastest.stat.rps;
			const c = test == fastest ? chalk.green : chalk.cyan;
			test.stat.percent = ((test.stat.rps / baseRps) * 100) - 100;
			let flag = test.async ? "*" : "";
			if (test == reference)
				flag += " (#)";

			let line = [
				"  ",
				pe(test.name + flag, maxTitleLength + 5),
				ps(formatNumber(test.stat.percent, 2, true) + "%", 8),
				ps("  (" + formatNumber(test.stat.rps) + " rps)", 20),
				"  (avg: " + humanize.short(test.stat.avg * 1000) + ")"
			];
			this.logger.log(c.bold(...line));
		});
		this.logger.log("-----------------------------------------------------------------------\n");

		// Generate result to return
		const result = this.tests.map(test => {
			let item = {
				name: test.name
			};

			if (test === fastest)
				item.fastest = true;

			if (test.reference)
				item.reference = true;

			if (test.error)
				item.error = test.error.toString();

			if (!test.skip)
				item.stat = test.stat;
			else
				item.skipped = true;

			return item;
		});

		return result;
	}
}

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
		this.logger = opts.logger || console;
		if (opts.spinner !== false) {
			this.spinner = ora({
				text: "Running benchmark...",
				spinner: {
					interval: 400,
					"frames": [
						".  ",
						".. ",
						"...",
						" ..",
						"  .",
						"   "
					]
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
		let title = "  " + this.name + "  ";
		let lines = "=".repeat(title.length);
		this.logger.log(chalk.yellow.bold(lines));
		this.logger.log(chalk.yellow.bold(title));
		this.logger.log(chalk.yellow.bold(lines));
		this.logger.log("");

		if (platformInfo)
			this.printPlatformInfo();

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
		let list = Array.from(suites || this.suites);
		let results = [];
		const start = new Date();

		/**
		 *
		 *
		 * @param {any} suite
		 * @returns
		 */
		function run(suite) {
			return suite.run().then(res => {
				results.push({
					name: suite.name,
					tests: res
				});

				if (list.length > 0)
					return run(list.shift());

				const now = new Date();
				return {
					name: self.name,
					suites: results,
					timestamp: +now,
					generated: now.toString(),
					elapsedMs: now - start
				};
			});
		}

		return run(list.shift());
	}
}

module.exports = Benchmarkify;
