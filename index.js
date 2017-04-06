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
		this.done = false;
		this.running = false;
		this.cycle = this.opts.cycle || 1000;

		this.timer = null;
		this.startTime = null;
		this.stopTime = null;
		
		this.stat = {
			duration: null,
			count: null,
			avg: null,			
			ips: null,
			cycle: this.cycle
		}
	}

	run() {
		const self = this;
		return new Promise(resolve => {
			// Start test
			const timeout = self.opts.time || self.suite.time;
			self.running = true;
			self.stat.count = 0;
			self.startTime = process.hrtime();

			// Create timer
			self.timer = setTimeout(() => {
				const diff = process.hrtime(self.startTime);
				self.stat.duration = diff[0] + diff[1] / 1e9;

				self.stat.avg = self.stat.duration / self.stat.count;
				self.stat.ips = self.stat.count / self.stat.duration;

				self.done = true;
				self.running = false;

				resolve(self);

			}, timeout);

			// Run
			if (self.async) {
				self.callFnAsync();
			} else {
				self.callFn();
			}
		});
	}

	callFn() {
		for (let i = 0; i < this.cycle; i++) {
			this.fn();
			this.stat.count++;
		}
		if (this.running) {
			setImmediate(() => {
				this.callFn();
			});
		}
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
			iteration: 0,
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

			let list = Array.from(this.tests);

			function run(test) {

				if (test.skip) {
					if (self.parent.spinner !== false)
						spinner.warn(chalk.yellow("[SKIP] " + test.name));	
					else
						self.logger.log(chalk.yellow("[SKIP]", test.name));

					if (list.length > 0)
						return run(list.shift());
					else
						return resolve();
				}

				if (self.parent.spinner !== false) {
					spinner.text = `Running '${test.name}'...`;
					spinner.start();
				}
				
				return test.run().then(() => {
					const ipsText = formatNumber(test.stat.ips);
					const resText = `${test.name} x ${ipsText} ips/sec`;

					if (self.parent.spinner !== false)
						spinner.succeed(resText);	
					else
						self.logger.log("››", resText);

					if (list.length > 0)
						return run(list.shift());

					return resolve();

				}).catch(err => {

					if (self.parent.spinner !== false)
						spinner.fail(chalk.red("[ERR] " + test.name));	
					else
						self.logger.log(chalk.red("[ERR] " + test.name));
					
					self.logger.error(err);

					if (list.length > 0)
						return run(list.shift());

					return resolve();					
				})
			}

			run(list.shift());

			/*
			this.suite.on("cycle", function(event) {
				let bench = event.target;
				if (bench.error)
					self.logger.error(chalk.red.bold(String(bench), bench.error.message, "\n", bench.error.stack || ""));
				else {
					if (self.opts.spinner !== false)
						spinner.succeed(String(bench));	
					else
						self.logger.log("››", String(bench));						
				}
			})
			.on("complete", function() {
				self.logger.log("");
				let tests = this.filter("successful");
				let maxTitle = tests.reduce((a, b) => a.name.length > b.name.length ? a : b).name;				
				let fastest = this.filter("fastest")[0];
				let pe = _.padEnd;
				let ps = _.padStart;

				tests.forEach(bench => {
					const c = bench == fastest ? chalk.green : chalk.cyan;
					let diff = ((bench.hz / fastest.hz) * 100) - 100;
					let line = [
						"  ", 
						pe(bench.name, maxTitle.length + 1), 
						ps(Number(diff).toFixed(2) + "%", 8), 
						ps("  (" + Benchmark.formatNumber(bench.hz.toFixed(0)) + " ops/sec)", 20)
					];
					self.logger.log(c.bold(...line));
				});
				self.logger.log("-----------------------------------------------------------------------\n");

				if (self.opts.spinner !== false)
					spinner.stop();

				let results = {
					name: self.opts.name
				};

				results.tests = tests.map(bench => ({
					name: bench.name,
					count: bench.hz
				}));

				results.timestamp = Date.now();
				results.generated = new Date().toString();

				return resolve(results);
			});

			this.logger.log(chalk.magenta.bold("Suite:", this.opts.name));
			this.suite.run({
				defer: this.async,
				async: this.async
			});
			*/

		}).then(() => {
			// Generate results from test stat

			if (self.parent.spinner !== false)
				spinner.stop();

			self.logger.log("");

			return self.calculateResult();
		});
	}

	calculateResult() {
		const result = this.tests.map(test => {
			return {
				name: test.name,
				skipped: test.skip,
				stat: test.skip ? null : test.stat
			}
		});

		let maxIps = 0;
		let maxTitleLength = 0;
		let fastest = null;
		this.tests.forEach(test => {
			if (test.skip) return;

			if (test.stat.ips > maxIps) {
				maxIps = test.stat.ips;
				fastest = test;
			}

			if (test.name.length > maxTitleLength)
				maxTitleLength = test.name.length;
		});

		//this.tests.sort((a, b) => b.stat.ips - a.stat.ips);

		if (fastest) {
			let pe = _.padEnd;
			let ps = _.padStart;

			this.tests.forEach(test => {
				if (test.skip) {
					this.logger.log(chalk.yellow("  ", test.name, "(skipped)"));
					return;
				}
				const c = test == fastest ? chalk.green : chalk.cyan;
				let diff = ((test.stat.ips / fastest.stat.ips) * 100) - 100;
				let line = [
					"  ", 
					pe(test.name, maxTitleLength + 1), 
					ps(Number(diff).toFixed(2) + "%", 8), 
					ps("  (" + formatNumber(test.stat.ips) + " ips/sec)", 20),
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