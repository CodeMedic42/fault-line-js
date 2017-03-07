/* eslint no-use-before-define: ["error", { "functions": false }] */

import EventEmitter from 'events';
import Stream from 'stream';
import util from 'util';
import uuid from 'uuid';
import Symbol from 'es6-symbol';
import SingleSpace from 'single-space';
import _isNil from 'lodash/isNil';
import _isArray from 'lodash/isArray';

import Pipe from './pipe';

export default SingleSpace('fault-line-js.streams.pipeline', () => {
    const privateSym = Symbol('private');

    function setupFaultComm() {
        const anonycb = (...args) => {
            EventEmitter.prototype.emit.call(this[privateSym].inlet, 'fault', ...args);
        };

        this.on('pipe', (src) => {
            src.on('fault', anonycb);
        });

        this.on('unpipe', (src) => {
            src.removeListener('fault', anonycb);
        });
    }

    function setupPipe(pipe) {
        if (!(pipe instanceof Pipe) && !(pipe instanceof Pipeline)) {
            throw new Error('Pipeline cannot only handle instances of Pipe or Pipeline.');
        }

        pipe.on('error', (...args) => {
            EventEmitter.prototype.emit.call(this, 'error', ...args);
        });
    }

    function Pipeline(pipes, options) {
        if (!(this instanceof Pipeline)) {
            return new Pipeline(pipes, options);
        }

        if (!_isArray(pipes) || pipes.length <= 0) {
            throw new Error('Only an array withy at least one item is valid.');
        }

        const _options = _isNil(options) ? {} : options;

        this[privateSym] = {
            name: _isNil(_options.name) ? uuid.v4() : _options.name,
            options: _options,
            isFaulted: false,
            reemitErrorsAsFaults: _isNil(_options.reemitErrorsAsFaults) ? true : _options.reemitErrorsAsFaults
        };

        Stream.Duplex.call(this, {
            objectMode: true
        });

        let previous = this[privateSym].inlet = pipes[0];

        setupPipe.call(this, previous);

        for (let counter = 1; counter < pipes.length; counter += 1) {
            const current = pipes[counter];

            setupPipe.call(this, current);

            previous.pipe(current);

            previous = current;
        }

        this[privateSym].outlet = previous;

        setupFaultComm.call(this, _options);

        this.on('finish', () => {
            this[privateSym].inlet.end();
        });

        this[privateSym].outlet.on('data', (chunk) => {
            this.push(chunk);
        }).on('end', () => {
            this.push(null);
        }).on('fault', (...args) => {
            this[privateSym].isFaulted = true;

            EventEmitter.prototype.emit.call(this, 'fault', ...args);
        });
    }

    util.inherits(Pipeline, Stream.Duplex);

    Pipeline.prototype._write = function _write(chunk, enc, next) {
        this[privateSym].inlet.write(chunk, enc);

        next();
    };

    Pipeline.prototype._read = function _read() {};

    Pipeline.prototype.emit = function emit(event, ...args) {
        if (event !== 'fault') {
            EventEmitter.prototype.emit.call(this, event, ...args);

            if (event !== 'error' || !this[privateSym].reemitErrorsAsFaults) {
                return;
            }
        }

        this.isFaulted = true;

        this[privateSym].inlet.emit('fault', ...args, this);
    };

    Pipeline.prototype.name = function name() {
        return this[privateSym].name;
    };

    Pipeline.prototype.isFaulted = function isFaulted() {
        return this[privateSym].isFaulted;
    };

    return Pipeline;
});
