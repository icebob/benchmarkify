const _ = require("lodash");
const Promise = require("bluebird");
const chalk = require("chalk");
const humanize = require('tiny-human-time');

const ora = require('ora');
const spinner = ora({ 
	text: 'Running benchmark...', 
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

function formatNumber(value, decimals = 0) {
	return Number(value.toFixed(decimals)).toLocaleString();
}

class TestCase {
	constructor(suite, name, fn, async, opts) {
		this.suite = suite;
		this.name = name;
		this.fn = fn;
		this.async = async;
		this.opts = opts || {};
		this.skip = false;
		this.error = null;
		this.done = false;
		this.running = false;
		this.time = this.opts.time || this.suite.time || 5000;
		this.cycles = this.opts.cycles || this.suite.cycles || 1000;
		this.minSamples = this.opts.minSamples || this.suite.minSamples || 5;

		this.timer = null;
		this.startTime = null;
		this.startHrTime = null;
		
		this.stat = {
			duration: null,
			cycle: 0,
			count: 0,
			avg: null,			
			rps: null
		}
	}

	run() {
		const self = this;
		return new Promise(resolve => {
			// Start test
			const timeout = self.opts.time || self.suite.time;
			
			self.start();

			// Create timer
			self.timer = setTimeout(() => {
				self.finish();
				resolve(self);
			}, timeout);

			// Run
			if (self.async) {
				self.callFnAsync(resolve);
			} else {
				self.cycling(resolve);
			}
		});
	}

	start() {
		this.running = true;
		this.stat.count = 0;
		this.startTime = Date.now();
		this.startHrTime = process.hrtime();
	}

	finish() {
		const diff = process.hrtime(this.startHrTime);
		const count = this.stat.count;
		const duration = diff[0] + diff[1] / 1e9;

		_.assign(this.stat, {
			duration,
			avg: duration / count,
			rps: count / duration
		});

		this.done = true;
		this.running = false;
	}

	cycling(resolve) {
		if (Date.now() - this.startTime < this.time || this.stat.count < this.minSamples) {
			for (let i = 0; i < this.cycles; i++) {
				this.fn();
				this.stat.count++;
			}
			this.stat.cycle++;
			setImmediate(() => {
				this.cycling(resolve);
			});
		} else {
			this.finish();
			resolve(this);
		}
		/*if (this.running) {
			setImmediate(() => {
				this.callFn();
			});
		}*/
	}
}

class Suite {
	constructor(parent, opts) {
		this.parent = parent;
		this.logger = this.parent.logger;
		this.done = false;
		this.running = false;

		this.tests = [];

		_.assign(this, {
			async: false,
			name: "<Anonymous suite>",
			time: 5000,
			cycles: 1000,
			minSamples: 5,
			spinner: true
		}, opts);
	}

	add(name, fn, opts = {}) {
		const self = this;
		const async = opts.async != null ? opts.async : this.async;

		const test = new TestCase(this, name, fn, async, opts);
		this.tests.push(test);

		return self;
		/*
		if (async) {
			this.suite.add(name, {
				defer: true,
				fn(deferred) {
					const res = fn();
					if (res.then)
						return fn().then(() => deferred.resolve());
					else
						return deferred.resolve();
				},
				onStart
			});
		} else {
			this.suite.add(name, { fn, onStart });
		}*/
	}

	skip(name, fn, opts = {}) {
		const async = opts.async != null ? opts.async : this.parent.async;

		const test = new TestCase(this, name, fn, async, opts);
		test.skip = true;
		this.tests.push(test);

		return this;
	}

	run() {
		let self = this;
		return new Promise((resolve, reject) => {
			self.running = true;
			self.logger.log(chalk.magenta.bold(`Suite: ${self.name}`));

			this.runTest(Array.from(this.tests), resolve);

		}).then(() => {
			// Generate results from test stat

			if (self.parent.spinner !== false)
				spinner.stop();

			self.logger.log("");

			return self.calculateResult();
		});
	}

	runTest(list, resolve) {
		const self = this;
		const test = list.shift();

		function printAndRun(type, msg, err) {
			if (self.parent.spinner !== false)
				spinner[type](msg);
			else
				self.logger.log("››", msg);

			if (err)
				self.logger.error(err);

			return list.length > 0 ? self.runTest(list, resolve) : resolve();
		}

		if (test.skip) {
			return printAndRun("warn", chalk.yellow("[SKIP] " + test.name));
		}

		if (this.parent.spinner !== false) {
			spinner.text = `Running '${test.name}'...`;
			spinner.start();
		}

		return test.run().delay(200).then(() => {
			return printAndRun("succeed", test.name + " × " + formatNumber(test.stat.rps) + " rps");

		}).catch(err => {
			test.error = err;
			return printAndRun("fail", chalk.red("[ERR] " + test.name), err);
		})
	}
		
	calculateResult() {
		const result = this.tests.map(test => {
			return {
				name: test.name,
				skipped: test.skip,
				error: test.error ? test.error.toString(): null,
				stat: test.skip ? null : test.stat
			}
		});

		let maxRps = 0;
		let maxTitleLength = 0;
		let fastest = null;
		this.tests.forEach(test => {
			if (test.skip) return;

			if (test.stat.rps > maxRps) {
				maxRps = test.stat.rps;
				fastest = test;
			}

			if (test.name.length > maxTitleLength)
				maxTitleLength = test.name.length;
		});

		//this.tests.sort((a, b) => b.stat.rps - a.stat.rps);

		if (fastest) {
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
				const c = test == fastest ? chalk.green : chalk.cyan;
				let diff = ((test.stat.rps / fastest.stat.rps) * 100) - 100;
				let line = [
					"  ", 
					pe(test.name, maxTitleLength + 1), 
					ps(Number(diff).toFixed(2) + "%", 8), 
					ps("  (" + formatNumber(test.stat.rps) + " rps)", 20),
					"  (avg: " + humanize.short(test.stat.avg * 1000) + ")"
				];
				this.logger.log(c.bold(...line));
			});
			this.logger.log("-----------------------------------------------------------------------\n");

		}

		return result;
	}
}

class Benchmarkify {
	constructor(name, logger) {
		this.name = name;
		this.logger = logger || console;
		this.Promise = Promise;

		this.suites = [];
	}

	printPlatformInfo() {
		require("./platform")(this.logger);
		this.logger.log("");	
	}

	printHeader(platformInfo = true) {
		let title = "  " + this.name + "  ";
		let lines = "=".repeat(title.length);
		this.logger.log(chalk.yellow.bold(lines));
		this.logger.log(chalk.yellow.bold(title));
		this.logger.log(chalk.yellow.bold(lines));
		this.logger.log("");	

		if (platformInfo)
			this.printPlatformInfo();
	}

	createSuite(opts) {
		const suite = new Suite(this, opts);

		this.suites.push(suite);

		return suite;
	}

	run(suites) {
		const self = this;
		let list = Array.from(suites || this.suites);
		let results = [];

		function run(suite) {
			return suite.run().then(res => {
				results.push(res);

				if (list.length > 0)
					return run(list.shift());

				return {
					name: self.name,
					tests: results,
					timestamp: Date.now(),
					generated: new Date().toString()					
				}
			});
		}

		return run(list.shift()).then(() => results);
	}
}

Benchmarkify.Promise = Promise;

module.exports = Benchmarkify;