"use strict";

let Benchmarkify = require("../");
let benchmark = new Benchmarkify("Simple example").printHeader();

const ITERATION = 1000;

benchmark.createSuite("String concatenate", { time: 1000, cycles: 5000 })
	.add("Concat with '+'", () => {
		let s = "";
		for(let i = 0; i < ITERATION; i++)
			s += "test" + i;
		return s;
	})
	.ref("Concat with array & join", () => {
		let s = [];
		for(let i = 0; i < ITERATION; i++)
			s.push("test" + i);
		return s.join();
	})
	.run().then(res => {
		console.log(JSON.stringify(res, null, 2));
	});
