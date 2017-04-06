"use strict";

let Benchmarkify = require("../");
let benchmark = new Benchmarkify("Simple example");
benchmark.printHeader();

const ITERATION = 1000;

benchmark.createSuite({ 
	name: "String concatenate", 
	async: false

}).add("Concat with '+'", () => {
	let s = "";
	for(let i = 0; i < ITERATION; i++)
		s += "test" + i;
	return s;

}).add("Concat with array & join", () => {
	let s = [];
	for(let i = 0; i < ITERATION; i++)
		s.push("test" + i);
	return s.join();

}).run().then(res => {
	console.log(res);
});
