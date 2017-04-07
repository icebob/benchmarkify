# benchmarkify
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
// The `.printHeader` will be print the name of benchmark & some
// information from the OS/PC to the console.
let benchmark = new Benchmarkify("Simple example").printHeader();

let i = 0;

// Create a test suite
benchmark.createSuite({ name: "Increment integer" })
.add("Increment with ++", () => {
	i++;
})
.add("Increment with i + 1", () => {
	i = i + 1;
}).run()
```

**Output**
```

```

# API
## Class Benchmarkify

## Class Suite



# License
benchmarkify is available under the [MIT license](https://tldrlegal.com/license/mit-license).

# Contact

Copyright (C) 2017 Icebob

[![@icebob](https://img.shields.io/badge/github-icebob-green.svg)](https://github.com/icebob) [![@icebob](https://img.shields.io/badge/twitter-Icebobcsi-blue.svg)](https://twitter.com/Icebobcsi)
