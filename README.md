# fault-line-js

A module to help clean up streaming systems.

[![npm version](https://badge.fury.io/js/fault-line-js.svg)](https://www.npmjs.com/package/fault-line-js)
[![Build Status](https://travis-ci.org/CodeMedic42/fault-line-js.svg?branch=master)](https://travis-ci.org/CodeMedic42/fault-line-js)
[![Coverage Status](https://coveralls.io/repos/github/CodeMedic42/fault-line-js/badge.svg?branch=master)](https://coveralls.io/github/CodeMedic42/fault-line-js?branch=master)

###Why does this module exist?

- I needed to create a complex streaming system of translators and validators, the amount of which is variable and conditional.
- I wanted a clean clean way of knowing when an error happens.
- I needed to deal with async processes and created a wrapper to generalize the streaming processes around promises.

###Install

```bash
npm install fault-line-js
```

###Quick Example

```js
const FaultLineJs = require('fault-line-js');

const inlet = FaultLineJs.Inlet({ name: 'example-inlet' }).on('error', () => {});
const pipeA = FaultLineJs.Pipe((data, enc, next) => { pipeA.push(`${data.toString()}_pipeA`); next(); });
const pipeB = FaultLineJs.Pipe({ name: 'pipeB' }, (data, enc, next) => { pipeB.push(`${data.toString()}_pipeB`); next(); });
const pipeline = FaultLineJs.Pipeline([pipeA, pipeB]);
const outlet = FaultLineJs.Outlet((data, enc, next) => { console.log(data.toString()); next(); });

inlet.pipe(pipeline).pipe(outlet)
.on('fault', (fault, source) => {
    console.log(`Fault happened on "${source.name()}". Fault was ${fault}`);
});

inlet.push('start');

console.log(pipeB.isFaulted()); // console => false

inlet.emit('error', 'BOOM!'); // console => Fault happened on "example-inlet". Fault was BOOM!

console.log(pipeB.isFaulted()); // console => true

inlet.push(null); // console => start_pipeA_pipeB
```

This example shows a few different parts of this system. Details can be found later in this doucment.

- Pipeline: Groups together one or more pipes or pipelines and combines them into a single stream.
- Fault system: Whenever an error is emited on a stream from this module a fault is also emited. Any faults emited on a stream are re-emited on the stream next in the pipeline. The example shows this because the on('fault') was only applied to the outlet stream yet it recieved the fault that was emited on the inlet.

## Streams

### Inlet

The inlet stream is a stream constructor which inherits from Stream.Readable.

It can be created by running

```js
const FaultLineJs = require('fault-line-js');

const inlet = FaultLineJs.Inlet();
```

Unlike a normal readable stream the _read function does not need to be defined. Though is still can be by normal means.

```js
const FaultLineJs = require('fault-line-js');

const inlet = FaultLineJs.Inlet();

inlet._read = function _read() {};
```

The Inlet constructor takes two parameters, _options_ and _read_, both of which are optional.

- options: Is an object with following properties.
    - name: A string value which will become the name of the stream. Helpful for identifiation when finding where issues are occuring. If not provided then uuid is created.
    - reemitErrorsAsFaults: If 'on' then when an error is emitted a fault will be emited right after with the same arguments. If 'off' then a fault will not be emited. If 'faultOnly' is used then the error will not be emited and a fault will take its place instead. Default is 'on'.
    - any normal options which exist for a Stream.Readable object.
- read: A function which will become the implementation of the _read function. If not defined then a no-op function is used instead.

### Outlet

The outlet stream is a stream constructor which inherits from Stream.Writable.

It can be created by running

```js
const FaultLineJs = require('fault-line-js');

const outlet = FaultLineJs.Outlet();

outlet._write = function _write() {};
```

Like a normal writable stream the _write function does need to be defined.

The Outlet constructor takes two parameters, _options_ and _write_, both of which are optional.

- options: Is an object with following properties.
    - name: A string value which will become the name of the stream. Helpful for identifiation when finding where issues are occuring. If not provided then uuid is created.
    - reemitErrorsAsFaults: If 'on' then when an error is emitted a fault will be emited right after with the same arguments. If 'off' then a fault will not be emited. If 'faultOnly' is used then the error will not be emited and a fault will take its place instead. Default is 'on'.
    - any normal options which exist for a Stream.Readable object.
- write: A function which will become the implementation of the _write function. If not defined then _write will not be defined and must be set directly as required by Stream.Writeable.

### Pipe

The pipe stream is a stream constructor which inherits from Stream.Transform.

It can be created by running

```js
const FaultLineJs = require('fault-line-js');

const pipe = FaultLineJs.Pipe();

outlet._transform = function _transform() {};
```

Like a normal transform stream the _transform function does need to be defined.
Like a normal transform stream the _flush function does not need to be defined.

The Pipe constructor takes three parameters, _options_, _transform_, and _flush_ all of which are optional.

- options: Is an object with following properties.
    - name: A string value which will become the name of the stream. Helpful for identifiation when finding where issues are occuring. If not provided then uuid is created.
    - reemitErrorsAsFaults: If 'on' then when an error is emitted a fault will be emited right after with the same arguments. If 'off' then a fault will not be emited. If 'faultOnly' is used then the error will not be emited and a fault will take its place instead. Default is 'on'.
    - any normal options which exist for a Stream.Readable object.
- transform: A function which will become the implementation of the _transform function. If not defined then _transform will not be defined and must be set directly as required by Stream.Transform.
- flush: A function which will become the implementation of the _flush function. If not defined then _flush will not be defined and can be set directly.

### Insulater

The Insulater stream is a stream constructor which inherits from Pipe.

It can be created by running

```js
const FaultLineJs = require('fault-line-js');

const insulater = FaultLineJs.Insulater({
    yeild: () => {}
});
```
The Insulater constructor takes 2 parameters, _insulatee_ and _options_. The first is required.

- insulatee: The insulater obfuscates a lot of the streaming compexities into three simple functions. This parameter defines them. This parameter is required.
    - start: This is called once when the insulater is first created. No parameters are given. The result of this function is what is pushed to the stream. This function is optional.
    - yeild: This is called for every peice of data the stream processes. Only one parameter is given, which is data from the stream. The result of this function is what is pushed to the stream. This function is required.
    - finish: This is called once when the last item in the stream has been sent. No parameters are given. The result of this function is what is pushed to the stream. This function is optional.
- options: Is an object with following properties.
    - any normal options which exist for a Pipe object.

The result of each of the insulatee functions can be anything. But there are two type which will be handled differently.
- Promises: If a promise is returned then the Insulater will take the result of that promise and push that to the stream rather than the promise.
- nil: If null or undefined is returned then nothing will be pushed to the stream.

In all other accounts an Insulater act exactly the same as Pipe.

### Pipeline

The pipeline stream is a stream constructor which inherits from Stream.Duplex. It's purpose is to allow complex streaming systems to be encapsulated and/or obfuscated into a single simple stream.

It can be created by running

```js
const FaultLineJs = require('fault-line-js');

const pipe = FaultLineJs.Pipe();

const pipeline = FaultLineJs.Pipeline([pipe]);
```

The Pipe constructor takes two parameters, _pipes_ and _options_.

- pipes: An array which can have any combination of Pipe or Pipeline stream. This array is required and must have at least one stream.
- options: Is an object with following properties.
    - name: A string value which will become the name of the stream. Helpful for identifiation when finding where issues are occuring. If not provided then uuid is created.
    - reemitErrorsAsFaults: If 'on' then when an error is emitted a fault will be emited right after with the same arguments. If 'off' then a fault will not be emited. If 'faultOnly' is used then the error will not be emited and a fault will take its place instead. Default is 'on'.
    - any normal options which exist for a Stream.Duplex object, except the object mode is determined dynamicly.


No additional functions are needed to be defined for a pipeline. All connetions are defined internally. This also means that the array of pipes do not need to be connected, the Pipeline contructor will do this for you.

The constructor will also automaticaly determine the object mode which will be needed. This is does by useing the modes for the first and last streams in the array. If the first stream has readableObjectMode set to true, then so will the Pipeline. If the last stream has writableObjectMode set to true, then so will the Pipeline.

## Flow

Faults only flow when two streams from this module are connected. This is acompilshed by the second stream calling _on('failt')_ on the first. This is all done internaly and is what makes the system work. This connection is made on the pipe event for that stream. The connection is broken when the unpipe event for the second stream is happens.

The flow of faults and errors for most of the streams are straight forward.

1. A fault is emited on one stream.
2. A stream connected to the first picks up on this event.
3. The second stream then re-emits it on itself.

Easy.

Pipelines though are a litte more complicated. Since they not only can be connected front and back to other streams, they also contain streams. The flow of faults and errors are a little more difficult.

For these examples we are going to use the sample code defined at the begining of this readme.

##### Situation #1

An error is emited on the inlet, which is exactly what happens in the sample code. But how does that fault flow?

1. The error is emited on inlet, which also causes a fault to be emitted.
2. The fault is emited on inlet.
3. The fault callbacks on inlet are ran.
4. pipeline, who is listening to inlet, does not run its fault callbacks. Instead it emits the fault on the first stream it contains(PipeA).
5. The fault callbacks on pipeA are ran.
6. pipeB, who is listening to pipeA, re-emits the fault on itself.
7. The fault callbacks on pipeB are ran.
8. pipeline who is also listening for faults on the last item it contains will now re-emit the fault on itself.
9. The fault callbacks on pipeline are ran.
10. outlet, who is listening to pipeline, re-emits the fault on itself.
11. The fault callbacks on outlet are ran.

##### Situation #2

An error(fault) is emited on the pipeline. But how does that fault flow?

1. The error is emited on pipeline, which also causes a fault to be emitted.
2. The fault is emited on pipeline.
3. pipeline does not run its fault callbacks. Instead it emits the fault on the first stream it contains(PipeA).
4. The fault callbacks on pipeA are ran.
5. pipeB, who is listening to pipeA, re-emits the fault on itself.
6. The fault callbacks on pipeB are ran.
7. pipeline who is also listening for faults on the last item it contains will now re-emit the fault on itself.
8. The fault callbacks on pipeline are ran.
9. outlet, who is listening to pipeline, re-emits the fault on itself.
10. The fault callbacks on outlet are ran.

##### Situation #2

An error is emited on the pipeA. But how does that fault flow?

1. The error is emited on pipeA, which also causes a fault to be emitted.
    1. pipeline, who is also listening to all error events from all pipes it contains, will re-emit the error on itself. This will __not__ generate a fault on pipeline. Internal faults can only flow out through the last stream in a pipeline.
2. The fault is emited on pipeA.
3. The fault callbacks on pipeA are ran.
4. pipeB, who is listening to pipeA, re-emits the fault on itself.
5. The fault callbacks on pipeB are ran.
6. pipeline who is also listening for faults on the last item it contains will now re-emit the fault on itself.
7. The fault callbacks on pipeline are ran.
8. outlet, who is listening to pipeline, re-emits the fault on itself.
9. The fault callbacks on outlet are ran.

##### Situation #3

An error is emited on the pipeB. But how does that fault flow?

1. The error is emited on pipeB, which also causes a fault to be emitted.
    1. pipeline, who is also listening to all error events from all pipes it contains, will re-emit the error on itself. This will __not__ generate a fault on pipeline. Internal faults can only flow out through the last stream in a pipeline.
2. The fault is emited on pipeB.
3. The fault callbacks on pipeB are ran.
4. pipeline who is also listening for faults on the last item it contains will now re-emit the fault on itself.
5. The fault callbacks on pipeline are ran.
6. outlet, who is listening to pipeline, re-emits the fault on itself.
7. The fault callbacks on outlet are ran.

##### Situation #4

An error is emited on the outlet. But how does that fault flow?

1. The error is emited on outlet, which also causes a fault to be emitted.
2. The fault is emited on outlet.
3. The fault callbacks on outlet are ran.

#### Summary

- Faults can be said to flow horizontaly through the streams, where errors flow verticaly up out of pipelines.
- An error should only ever trigger a fault once, even if the error is emited from the children of a pipeline and re-emited by that same pipeline.
