"use strict";

let PromiseBB = require("bluebird");

let Benchmarkify = require("../");
Benchmarkify.printHeader("Promise vs BlueBird vs Native");

let bench1 = new Benchmarkify({ async: true, name: "Promise"});

function add(a, b) {
	return a + b;
}

bench1.add("No promise", () => {
	return add(5, 8);
}, false);

bench1.add("ES6 Promise.resolve", () => {
	return Promise.resolve().then(() => {
		return add(5, 8);
	});
});

bench1.add("ES6 new Promise", () => {
	return new Promise(resolve => {
		resolve(add(5, 8));
	});
});

let bench2 = new Benchmarkify({ async: true, name: "BlueBird"});

bench2.add("Bluebird Promise.resolve", () => {
	return PromiseBB.resolve().then(() => {
		return add(5, 8);
	});
});

bench2.add("Bluebird new Promise", () => {
	return new PromiseBB(resolve => {
		resolve(add(5, 8));
	});
});

Benchmarkify.run([bench1, bench2]).then(res => {
	console.log(res);
});