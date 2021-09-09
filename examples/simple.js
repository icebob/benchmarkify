"use strict";

const { inspect } = require("util");
const Benchmarkify = require("../");
const benchmark = new Benchmarkify("Simple example", { description: "This is a common benchmark" }).printHeader();

const ITERATION = 1000;

benchmark.createSuite("String concatenate", { time: 1000, description: "Concatenate string in different ways" })
	.add("Concat with '+'", () => {
		let s = "";
		for (let i = 0; i < ITERATION; i++)
			s += "test" + i;
		return s;
	})
	.ref("Concat with array & join", () => {
		let s = [];
		for (let i = 0; i < ITERATION; i++)
			s.push("test" + i);
		return s.join();
	});

benchmark.run().then(res => {
	console.log(inspect(res, { depth: 5, colors: true }));
});
