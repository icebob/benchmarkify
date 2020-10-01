"use strict";

let Benchmarkify = require("../");
let benchmark = new Benchmarkify("Multi example", { spinner: false }).printHeader();

let bench1 = benchmark.createSuite("Date performance", {
	time: 1000,
	cycles: 1000000,
});

bench1.add("Call Date.now", () => Date.now());
bench1.add("Call process.hrtime", () => process.hrtime());

let bench2 = benchmark.createSuite("Increment integer", {
	time: 2000,
	cycles: 1000000,
});

let i1 = 0;
bench2.add("Increment with ++", () => (i1++, i1));

let i2 = 0;
bench2.ref("Increment with +=", () => (i2 += 1, i2));

let i3 = 0;
bench2.add("Increment with = i + 1", () => (i3 = i3 + 1, i3));

benchmark.run([bench1, bench2]).then(res => {
	console.log(JSON.stringify(res, null, 2));
});
