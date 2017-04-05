"use strict";

let Benchmarkify = require("../");
Benchmarkify.printHeader("Multi example");

let bench1 = new Benchmarkify({ async: false, name: "Date performance", resultFile: "./bench-results/multi.json"});

const cycle = 10 * 1000;

bench1.add("Call Date.now", () => {
	let c = 0;
	let time;
	while (++c < cycle) {
		time = Date.now();
	}
	return time;
});

bench1.add("Call process.hrtime", () => {
	let c = 0;
	let time;
	while (++c < cycle) {
		time = process.hrtime();
	}
	return time;
});

let bench2 = new Benchmarkify({ async: false, name: "Increment integer", resultFile: "./bench-results/multi.json"});

const ITERATION = 1000;
let i1 = 0;
bench2.add("Increment with ++", () => {
	i1++;
});

let i2 = 0;
bench2.add("Increment with +=", () => {
	i2 += 1;
});

let i3 = 0;
bench2.add("Increment with = i + 1", () => {
	i3 = i3 + 1;
});

Benchmarkify.run([bench1, bench2])
.then(res => {
	console.log(res);
});