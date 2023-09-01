# :zap: benchmarkify
Benchmark framework for Node.js for measure the execution time of JS codes. It can generate JSON result, chart image or draw a simple bar chart to the console.

# Installation
```
$ npm i benchmarkify
```

# Usage

**Example benchmark suite**
```js
const Benchmarkify = require("benchmarkify");

// Create a new benchmark
// The `.printHeader` method will print the name of benchmark & some
// information from the OS/PC to the console.
const benchmark = new Benchmarkify("Simple example", { description: "This is a common benchmark", chartImage: true }).printHeader();

// Create a test suite
benchmark.createSuite("String concatenate", { time: 1000, description: "Concatenate string in different ways" })

    .add("Concat with '+'", () => {
		let s = "";
		for (let i = 0; i < 1000; i++)
			s += "test" + i;
		return s;
	})

	.ref("Concat with array & join", () => {
		let s = [];
		for (let i = 0; i < 1000; i++)
			s.push("test" + i);
		return s.join();
	});

benchmark.run();
```

**Output**
```
==================
  Simple example
==================

Platform info:
==============
   Windows_NT 10.0.19045 x64
   Node.JS: 18.16.0
   V8: 10.2.154.26-node.26
   CPU: 13th Gen Intel(R) Core(TM) i5-13500 × 20
   Memory: 32 GB

Suite: String concatenate
=========================

√ Concat with '+'                105 533 ops/sec
√ Concat with array & join        57 987 ops/sec

   Concat with '+'                +81,99%    (105 533 ops/sec)   (avg: 9μs)
   Concat with array & join (#)        0%     (57 987 ops/sec)   (avg: 17μs)

┌──────────────────────────┬────────────────────────────────────────────────────┐
│ Concat with '+'          │ ██████████████████████████████████████████████████ │
├──────────────────────────┼────────────────────────────────────────────────────┤
│ Concat with array & join │ ███████████████████████████                        │
└──────────────────────────┴────────────────────────────────────────────────────┘

Chart: https://image-charts.com/chart.js/2.8.0?bkg=white&c=%7B%22type%22%3A%22bar%22%2C%22data%22%3A%7B%22labels%22%3A%5B%22Concat%20with%20%27%2B%27%22%2C%22Concat%20with%20array%20%26%20join%22%5D%2C%22datasets%22%3A%5B%7B%22label%22%3A%22Dataset%201%22%2C%22backgroundColor%22%3A%22rgba%2854%2C%20162%2C%20235%2C%200.5%29%22%2C%22borderColor%22%3A%22rgb%2854%2C%20162%2C%20235%29%22%2C%22borderWidth%22%3A1%2C%22data%22%3A%5B105532.65917212216%2C57986.883366982394%5D%7D%5D%7D%2C%22options%22%3A%7B%22responsive%22%3Afalse%2C%22legend%22%3A%7B%22display%22%3Afalse%2C%22position%22%3A%22top%22%7D%2C%22title%22%3A%7B%22display%22%3Atrue%2C%22text%22%3A%22String%20concatenate%7C%28ops%2Fsec%29%22%7D%2C%22layout%22%3A%7B%22padding%22%3A20%7D%7D%7D
-----------------------------------------------------------------------
```

**Example chart image**
![Example chart image](https://image-charts.com/chart.js/2.8.0?bkg=white&c=%7B%22type%22%3A%22bar%22%2C%22data%22%3A%7B%22labels%22%3A%5B%22Concat%20with%20%27%2B%27%22%2C%22Concat%20with%20array%20%26%20join%22%5D%2C%22datasets%22%3A%5B%7B%22label%22%3A%22Dataset%201%22%2C%22backgroundColor%22%3A%22rgba%2854%2C%20162%2C%20235%2C%200.5%29%22%2C%22borderColor%22%3A%22rgb%2854%2C%20162%2C%20235%29%22%2C%22borderWidth%22%3A1%2C%22data%22%3A%5B105320.73392654078%2C57369.423976363796%5D%7D%5D%7D%2C%22options%22%3A%7B%22responsive%22%3Afalse%2C%22legend%22%3A%7B%22display%22%3Afalse%2C%22position%22%3A%22top%22%7D%2C%22title%22%3A%7B%22display%22%3Atrue%2C%22text%22%3A%22String%20concatenate%7C%28ops%2Fsec%29%22%7D%2C%22layout%22%3A%7B%22padding%22%3A20%7D%7D%7D)

**JSON result**

If you need the results in JSON use `.then` after `run()`

```js
benchmark.run().then(res => console.log(res));
```

**Result on the console:**
```js
{
  name: 'Simple example',
  description: 'This is a common benchmark',
  meta: {},
  suites: [
    {
      name: 'String concatenate',
      description: 'Concatenate string in different ways',
      meta: {},
      unit: 'ops/sec',
      tests: [
        {
          name: "Concat with '+'",
          meta: {},
          unit: 'ops/sec',
          fastest: true,
          stat: {
            duration: 1.0064495,
            cycle: 106,
            count: 106000,
            avg: 0.000009494806603773585,
            rps: 105320.73392654078,
            percent: 83.58339098878338
          }
        },
        {
          name: 'Concat with array & join',
          meta: {},
          unit: 'ops/sec',
          reference: true,
          stat: {
            duration: 1.0109915,
            cycle: 58,
            count: 58000,
            avg: 0.000017430887931034482,
            rps: 57369.423976363796,
            percent: 0
          }
        }
      ]
    }
  ],
  timestamp: 1693594301782,
  generated: 'Fri Sep 01 2023 20:51:41 GMT+0200 (közép-európai nyári idő)',
  elapsedMs: 2466
}
```

# API

## Class Benchmarkify

```js
const benchmark = new Benchmarkify("Benchmark #1", opts);
```

### Constructor options
* `logger` - print messages to this logger. Default: `console`
* `spinner` - show spinner when running tests. Default: `true`
* `minSamples` - Minimum samples. Default: `0` - not used
* `description` - Custom description field.
* `meta` - To store any meta information. Result JSON contains it.
* `chartImage` - Generate chart image url and print to the console after every suite.
* `drawChart` - Draw a bar chart to the console after every suite. Default: `true`

### Methods
* `createSuite` - Create a new benchmark suite.
* `run(suites: Array): Promise` - 

## Class Suite

```js
const bench1 = benchmark.createSuite("Date performance", { time: 1000 });
```

### Constructor options
* `name` - Name of suite.
* `time` - Time of test. Default: `5000` (5sec)
* `minSamples` - Minimum samples. Default `0` - disabled
* `description` - Custom description field.
* `unit` - Measurement unit. Default: `"ops/sec"`.
* `meta` - To store any meta information. Result JSON contains it.

### Methods
* `add(name: string, fn: Function, opts: Object)` - Add a function to the suite
* `skip(name: string, fn: Function, opts: Object)` - Skip the function
* `only(name: string, fn: Function, opts: Object)` - Run only this function
* `ref(name: string, fn: Function, opts: Object)` - Add a function and it'll be the reference
* `run(): Promise` - Run the suite.
* `setup(fn): Promise` - Function to execute before test suite.
* `tearDown(fn): Promise` - Function to execute after test suite.

### Async functions
If you would like to test async function use the `done` callback.

```js
bench.add("Async call test", done => {
    asyncFunction(data).then(() => done());
});
```

or 

```js
bench.add("Async call test", async done => {
    await asyncFunction(data)
    done();
});
```

# License
Benchmarkify is available under the [MIT license](https://tldrlegal.com/license/mit-license).

# Contact

Copyright (C) 2023 Icebob

[![@icebob](https://img.shields.io/badge/github-icebob-green.svg)](https://github.com/icebob) [![@icebob](https://img.shields.io/badge/twitter-Icebobcsi-blue.svg)](https://twitter.com/Icebobcsi)
