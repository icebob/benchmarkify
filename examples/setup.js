"use strict";

const Benchmarkify = require("../");
const benchmark = new Benchmarkify("Setup - Teardown example").printHeader();

let obj, map;
let counter = 0;

benchmark
	.createSuite("Object vs Map", { time: 1000, description: "Concatenate string in different ways" })
	.setup(() => {
		console.log("Set up is called.");
		obj = {};
		map = new Map();
	})
	.add("Add property to 'Object'", () => {
		obj["" + counter++] = counter;
	})
	.ref("Add item to 'Map'", () => {
		map.set("" + counter++, counter);
	})
	.tearDown(() => {
		console.log("Tear down is called.");
	});

benchmark.run();
