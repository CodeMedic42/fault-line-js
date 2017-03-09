import EventEmitter from 'events';
import Stream from 'stream';
import Uuid from 'uuid';
import Util from 'util';
import SingleSpace from 'single-space';
import _isNil from 'lodash/isNil';
import _isFunction from 'lodash/isFunction';

export default SingleSpace('fault-line-js.streams.pipe', () => {
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
     * Defines a transform stream which will emit a fault and will take a fault from it's predececor in the pipeline. Will emit a fault on the next stream in the pipeline.
     *
     * @param {Pipe.options} [options] Options which define how the stream will work.
     *
     * @constructs Pipe
     *
     * @extends Stream.Duplex
     */
    function Pipe(...args) {
        if (!(this instanceof Pipe)) {
            return new Pipe(...args);
        }

        let options = null;
        let transform = null;

        if (args.length === 2) {
            options = args[0];
            transform = args[1];
        } else if (args.length === 1) {
            if (_isFunction(args[0])) {
                transform = args[0];
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

        Stream.Transform.call(this, _options);

        if (_isFunction(transform)) {
            this._transform = transform;
        }

        setupFaultComm.call(this);
    }

    Util.inherits(Pipe, Stream.Transform);

    /**
     * An override of the emit function from node EventEmitter. If an error is beeing emitted then a faul will be emitted after the first completes. If a fault is emitted then this stream will be marked as faulted and the fault will passed down the stream.
     *
     * @param  {string} event The event to emit
     * @param  {...any} args  The arguments to emit.
     */
    Pipe.prototype.emit = function emit(event, ...args) {
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
    Pipe.prototype.name = function name() {
        return this[privateSym].name;
    };

    /**
     * Will return the faulted state of this stream.
     *
     * @return {boolean} A value which indicates of a fault has been emitted from this stream.
     */
    Pipe.prototype.isFaulted = function isFaulted() {
        return this[privateSym].isFaulted;
    };

    return Pipe;
});
