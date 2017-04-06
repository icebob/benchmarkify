"use strict";

let Benchmarkify = require("../");
let benchmark = new Benchmarkify("Multi example");
benchmark.printHeader();

let bench1 = benchmark.createSuite({ name: "Date performance", async: false, time: 1000 });

const cycle = 10 * 1000;

bench1.add("Call Date.now", () => {
	let c = 0;
	let time;
	while (++c < cycle) {
		time = Date.now();
	}
	//throw new Error("Csak úgy!");
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

let bench2 = benchmark.createSuite({ name: "Increment integer", async: false, time: 1000 });

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

benchmark.run([bench1, bench2])
.then(res => {
	console.log(JSON.stringify(res, null, 2));
});
