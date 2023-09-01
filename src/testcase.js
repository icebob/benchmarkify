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
		this.startHrTime = process.hrtime();
	}

	/**
	 *
	 *
	 *
	 * @memberOf TestCase
	 */
	finish() {
		const diff = process.hrtime(this.startHrTime);
		const count = this.stat.count;
		const duration = diff[0] + diff[1] / 1e9;

		Object.assign(this.stat, {
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
		if (Date.now() - this.startTime < this.time || this.stat.count < this.minSamples) {
			for (let i = 0; i < this.cycles; i++) {
				this.fn();
				this.stat.count++;
			}

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
	 *
	cyclingAsync(resolve, reject) {
		const self = this;
		const fn = self.fn;
		let c = 0;
		function cycle() {
			return fn().then(() => {
				self.stat.count++;
				c++;

				if (c >= self.cycles) {
					if (Date.now() - self.startTime < self.time || self.stat.count < self.minSamples) {
						c = 0;
						return new Promise(resolve => {
							setImmediate(() => resolve(cycle()));
						});
					}
				} else {
					return cycle();
				}
			});
		}

		return cycle()
			.then(() => {
				self.finish();
				resolve(self);
			}).catch(reject);
	}*/

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
		let c = 0;

		function cycle() {
			fn(function () {
				self.stat.count++;
				c++;

				if (c >= self.cycles) {
					if (
						Date.now() - self.startTime < self.time ||
						self.stat.count < self.minSamples
					) {
						// Wait for new cycle
						c = 0;
						setImmediate(() => cycle());
					} else {
						// Finished
						self.finish();
						resolve(self);
					}
				} else {
					// Next call
					cycle();
				}
			});
		}

		// Start
		cycle();
	}
}

module.exports = TestCase;