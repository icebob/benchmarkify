"use strict";

const PromiseBB = require("bluebird");

function add(a, b) {
	return a + b;
}

const Benchmarkify = require("../");
const benchmark = new Benchmarkify("ES6 Promise vs BlueBird vs await").printHeader();

const bench1 = benchmark.createSuite("Without promise");

bench1.add("Sync", () => {
	add(5, 8);
});

bench1.add("Callback", done => {
	add(5, 8);
	done();
});

const bench2 = benchmark.createSuite("ES6");

bench2.add("ES6 Promise.resolve", done => {
	return Promise.resolve().then(() => {
		add(5, 8);
		done();
	});
});

bench2.add("ES6 new Promise", done => {
	return new Promise(resolve => {
		resolve(add(5, 8));
		done();
	});
});

const bench3 = benchmark.createSuite("Bluebird");

bench3.add("Bluebird Promise.resolve", done => {
	return PromiseBB.resolve().then(() => {
		add(5, 8);
		done();
	});
});

bench3.add("Bluebird new Promise", done => {
	return new PromiseBB(resolve => {
		resolve(add(5, 8));
		done();
	});
});

const bench4 = benchmark.createSuite("Async/await");

bench4.add("Async/await", async done => {
	await add(5, 8);
	done();
});

benchmark.run([bench1, bench2, bench3, bench4]).then(res => {
	//console.log(JSON.stringify(res, null, 2));
});
