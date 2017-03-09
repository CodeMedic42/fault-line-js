/* eslint no-use-before-define: ["error", { "functions": false }] */

import EventEmitter from 'events';
import Stream from 'stream';
import Util from 'util';
import Uuid from 'uuid';
import Symbol from 'es6-symbol';
import SingleSpace from 'single-space';
import _isNil from 'lodash/isNil';
import _isArray from 'lodash/isArray';
import _merge from 'lodash/merge';

import Pipe from './pipe';

export default SingleSpace('fault-line-js.streams.pipeline', () => {
    const privateSym = Symbol('private');

    /**
     * Emits a fault with the given arguments.
     *
     * @param  {...any} args The arguments of the fault.
     * @param  {stream} source The original source of the fault.
     */
    function emitFault(...args) {
        this[privateSym].isFaulted = true;

        this[privateSym].inlet.emit('fault', ...args);
    }

    /**
     * Sets up the fault system when this stream is piped to another. Unsets up the fault system when unpipe happens.
     */
    function setupFaultComm() {
        const anonycb = emitFault.bind(this);

        this.on('pipe', (src) => {
            src.on('fault', anonycb);
        });

        this.on('unpipe', (src) => {
            src.removeListener('fault', anonycb);
        });
    }

    /**
     * Setup the connectons needed between this stream and the given pipe.
     *
     * @param {Pipe|Pipeline} pipe Either a pipe or a pipeline.
     */
    function setupPipe(pipe) {
        if (!(pipe instanceof Pipe) && !(pipe instanceof Pipeline)) {
            throw new Error('Pipeline cannot only handle instances of Pipe or Pipeline.');
        }

        pipe.on('error', (...args) => {
            EventEmitter.prototype.emit.call(this, 'error', ...args);
        });
    }

    /**
     * Pipe the streams together.
     *
     * @param {(Pipe|Pipeline)[]} pipes An array of either pipes or pipelines. Must have at least one stream.
     */
    function setupPipes(pipes) {
        if (!_isArray(pipes) || pipes.length <= 0) {
            throw new Error('Only an array with at least one item is valid.');
        }

        let previous = this[privateSym].inlet = pipes[0];

        setupPipe.call(this, previous);

        for (let counter = 1; counter < pipes.length; counter += 1) {
            const current = pipes[counter];

            setupPipe.call(this, current);

            previous.pipe(current);

            previous = current;
        }

        this[privateSym].outlet = previous;
    }

    /**
     * Sets up the connections between the first stream item and that last one..
     */
    function setupComm() {
        setupFaultComm.call(this);

        this.on('finish', () => {
            this[privateSym].inlet.end();
        });

        this[privateSym].outlet.on('data', (chunk, enc) => {
            this.push(chunk, enc);
        }).on('end', () => {
            this.push(null);
        }).on('fault', (...args) => {
            this[privateSym].isFaulted = true;

            EventEmitter.prototype.emit.call(this, 'fault', ...args);
        });
    }

    /**
     * Defines a duplex stream which can take an array of pipes or pipelines and combine them into a single stream. Will emit errors that are emited from the array of streams. Will emit any faults that emerge from the last stmrea in the array.
     *
     * @param {(Pipe|Pipeline)[]} pipes An array of either pipes or pipelines. Must have at least one stream.
     * @param {Pipeline.options} [options] Options which define how the stream will work.
     *
     * @constructs Pipeline
     *
     * @extends Stream.Duplex
     */
    function Pipeline(pipes, options) {
        if (!(this instanceof Pipeline)) {
            return new Pipeline(pipes, options);
        }

        const _options = _merge({}, options);

        this[privateSym] = {
            name: _isNil(_options.name) ? Uuid.v4() : _options.name,
            isFaulted: false,
            reemitErrorsAsFaults: _isNil(_options.reemitErrorsAsFaults) ? 'on' : _options.reemitErrorsAsFaults
        };

        setupPipes.call(this, pipes);

        delete _options.objectMode;
        _options.readableObjectMode = this[privateSym].inlet._readableState.objectMode;
        _options.writableObjectMode = this[privateSym].outlet._writableState.objectMode;

        Stream.Duplex.call(this, _options);

        setupComm.call(this);
    }

    Util.inherits(Pipeline, Stream.Duplex);

    /**
     * Do not override, this is handled internally. This function is required to be deifned by node streams and cannot be hidden at this time. If this gets moddifed then things will fail.
     */
    Pipeline.prototype._write = function _write(chunk, enc, next) {
        this[privateSym].inlet.write(chunk, enc);

        next();
    };

    /**
     * Do not override, this is handled internally. This function is required to be deifned by node streams and cannot be hidden at this time. If this gets moddifed then things will fail.
     */
    Pipeline.prototype._read = function _read() {};

    /**
     * An override of the emit function from node EventEmitter. If an error is beeing emitted then a faul will be emitted after the first completes. If a fault is emitted then this stream will be marked as faulted and the fault will passed down the stream.
     *
     * @param  {string} event The event to emit
     * @param  {...any} args  The arguments to emit.
     */
    Pipeline.prototype.emit = function emit(event, ...args) {
        if (event !== 'fault' && event !== 'error') {
            EventEmitter.prototype.emit.call(this, event, ...args);
        } else if (event === 'error') {
            if (this[privateSym].reemitErrorsAsFaults !== 'faultOnly') {
                EventEmitter.prototype.emit.call(this, event, ...args);
            }

            if (this[privateSym].reemitErrorsAsFaults !== 'off') {
                emitFault.call(this, ...args, this);
            }
        } else {
            emitFault.call(this, ...args, this);
        }
    };

    /**
     * Retrieves the name of the stream.
     *
     * @return {string} The name of the stream.
     */
    Pipeline.prototype.name = function name() {
        return this[privateSym].name;
    };

    /**
     * Will return the faulted state of this stream.
     *
     * @return {boolean} A value which indicates of a fault has been emitted from this stream.
     */
    Pipeline.prototype.isFaulted = function isFaulted() {
        return this[privateSym].isFaulted;
    };

    return Pipeline;
});
