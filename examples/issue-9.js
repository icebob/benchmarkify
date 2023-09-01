const Benchmarkify = require("../");

const benchmark = new Benchmarkify("Simple example").printHeader();

const suite = benchmark.createSuite("String Concatenation");

let age = 15;

suite
	.setup(() => age = 21)
	.add("add ref", function () {
		return "Whiskey has an Age of " + age + " years.";
	})
	.add("join", function () {
		return ["Whiskey has an Age of", age, "years."].join(" ");
	})
	.ref("add", function () {
		return "Whiskey has an Age of " + age + " years.";
	})
	.add("concat", function () {
		return "Whiskey has an Age of ".concat(age).concat(" years.");
	})
	.add("interpolate", function () {
		return `Whiskey has an Age of ${age} years.`;
	})
	.run();