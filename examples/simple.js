"use strict";

let Benchmarkify = require("../");
Benchmarkify.printHeader("Simple example");

let bench = new Benchmarkify({ async: false, name: "String concatenate"});

const ITERATION = 1000;
bench.add("Concat with '+'", () => {
	let s = "";
	for(let i = 0; i < ITERATION; i++)
		s += "test" + i;
	return s;
});

bench.add("Concat with array & join", () => {
	let s = [];
	for(let i = 0; i < ITERATION; i++)
		s.push("test" + i);
	return s.join();
});

bench.run().then(res => {
	console.log(res);
});
