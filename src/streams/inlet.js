import EventEmitter from 'events';
import Stream from 'stream';
import Util from 'util';
import Uuid from 'uuid';
import Symbol from 'es6-symbol';
import SingleSpace from 'single-space';
import _isNil from 'lodash/isNil';
import _isFunction from 'lodash/isFunction';

export default SingleSpace('fault-line-js.streams.inlet', () => {
    const privateSym = Symbol('private');

    /**
     * Emits a fault with the given arguments.
     *
     * @param  {...any} args The arguments of the fault.
     * @param  {stream} source The original source of the fault.
     */
    function emitFault(...args) {
        this[privateSym].isFaulted = true;

        EventEmitter.prototype.emit.call(this, 'fault', ...args);
    }

    /**
     * Defines a readable stream which can emit and recieve a fault.
     *
     * @param {Inlet.options} [options] Options which define how the stream will work.
     * @param {function} [read] A function which will take the place of _read.
     *
     * @constructs Inlet
     *
     * @extends Stream.Readable
     */
    function Inlet(...args) {
        if (!(this instanceof Inlet)) {
            return new Inlet(...args);
        }

        let options = null;
        let read = null;

        if (args.length >= 2) {
            options = args[0];
            read = args[1];
        } else if (args.length === 1) {
            if (_isFunction(args[0])) {
                read = args[0];
            } else {
                options = args[0];
            }
        }

        const _options = _isNil(options) ? {} : options;

        this[privateSym] = {
            name: _isNil(_options.name) ? Uuid.v4() : _options.name,
            options: _options,
            isFaulted: false,
            reemitErrorsAsFaults: _isNil(_options.reemitErrorsAsFaults) ? 'on' : _options.reemitErrorsAsFaults
        };

        if (_isFunction(read)) {
            this._read = read;
        }

        Stream.Readable.call(this, _options);
    }

    Util.inherits(Inlet, Stream.Readable);

    /**
     * An override of the emit function from node EventEmitter. If an error is beeing emitted then a faul will be emitted after the first completes. If a fault is emitted then this stream will be marked as faulted and the fault will passed down the stream.
     *
     * @param  {string} event The event to emit
     * @param  {...any} args  The arguments to emit.
     */
    Inlet.prototype.emit = function emit(event, ...args) {
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
     * A function which needs to be defined. Inlet defines this by default as a no op function.
     */
    Inlet.prototype._read = function noop() {};

    /**
     * Retrieves the name of the stream.
     *
     * @return {string} The name of the stream.
     */
    Inlet.prototype.name = function name() {
        return this[privateSym].name;
    };

    /**
     * Will return the faulted state of this stream.
     *
     * @return {boolean} A value which indicates of a fault has been emitted from this stream.
     */
    Inlet.prototype.isFaulted = function isFaulted() {
        return this[privateSym].isFaulted;
    };

    return Inlet;
});
