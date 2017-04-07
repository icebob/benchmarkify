# :zap: benchmarkify
Benchmark framework for NodeJS for measure the execution time of JS codes.

# Installation
```
$ npm install benchmarkify --save-dev
```

# Usage

```js
// Load
let Benchmarkify = require("benchmarkify");

// Create a new benchmark
// The `.printHeader` will be print the name of benchmark & some
// information from the OS/PC to the console.
let benchmark = new Benchmarkify("Simple example").printHeader();
```

**Example benchmark suite**
```js
// Load
let Benchmarkify = require("benchmarkify");

// Create a new benchmark
// The `.printHeader` method will print the name of benchmark & some
// information from the OS/PC to the console.
let benchmark = new Benchmarkify("Simple example").printHeader();

let i = 0;

// Create a test suite
let bench1 = benchmark.createSuite({ name: "Increment integer" });

// Add first func
bench1.add("Increment with ++", () => {
	i++;
});

// Add second func. This result will be the reference
bench1.ref("Increment with i + 1", () => {
	i = i + 1;
});

bench1.run();
```

**Output**
```

```

# API

## Class Benchmarkify

### Constructor options
* `logger` - default: console
* `spinner` - default: true
* `minSamples` - default 0

### Methods
* `createSuite` -
* `run(suites: Array): Promise` - 

## Class Suite

### Constructor options
* `name` - 
* `time` - default: 5000
* `minSamples` - default 0

### Methods
* `add(name: string, fn: Function, opts: Object)` - 
* `skip(name: string, fn: Function, opts: Object)` - 
* `only(name: string, fn: Function, opts: Object)` - 
* `ref(name: string, fn: Function, opts: Object)` - 
* `run(): Promise` - 

### Async functions

## Resultset

# License
benchmarkify is available under the [MIT license](https://tldrlegal.com/license/mit-license).

# Contact

Copyright (C) 2017 Icebob

[![@icebob](https://img.shields.io/badge/github-icebob-green.svg)](https://github.com/icebob) [![@icebob](https://img.shields.io/badge/twitter-Icebobcsi-blue.svg)](https://twitter.com/Icebobcsi)
