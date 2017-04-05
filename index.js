const _ = require("lodash");
const Promise = require("bluebird");
const chalk = require("chalk");
const Benchmark = require("benchmark");

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

class Benchmarkify {
	constructor(opts) {
		this.opts = _.defaultsDeep(opts, {
			async: false,
			name: ""
		});
		this.suite = new Benchmark.Suite;
		this.logger = this.opts.logger || console;
		this.async = this.opts.async;
	}

	add(name, fn, async = this.async) {
		let self = this;
		let onStart = function() {
			if (self.opts.spinner !== false) {
				spinner.text = `Running '${name}'...`;
				spinner.start();
			}
		};

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
		}
	}

	skip() {
		return Promise.resolve();
	}

	run() {
		let self = this;
		return new Promise((resolve, reject) => {
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
			
		});
	}

	static printHeader(name, logger, platformInfo = true) {
		logger = logger || console;

		let title = "  " + name + "  ";
		let lines = "=".repeat(title.length);
		logger.log(chalk.yellow.bold(lines));
		logger.log(chalk.yellow.bold(title));
		logger.log(chalk.yellow.bold(lines));
		logger.log("");	

		if (platformInfo) {
			require("./platform")(logger);
			logger.log("");	
		}
	}

	static run(suites) {
		let list = Array.from(suites);
		let results = [];

		function run(suite) {
			return suite.run().then(res => {
				results.push(res);

				if (list.length > 0)
					return run(list.shift());

				return results;
			});
		}

		return run(list.shift()).then(() => results);
	}
}

Benchmarkify.Promise = Promise;

module.exports = Benchmarkify;