import EventEmitter from 'events';
import Stream from 'stream';
import uuid from 'uuid';
import Util from 'util';
import SingleSpace from 'single-space';
import _isNil from 'lodash/isNil';
import _isFunction from 'lodash/isFunction';

export default SingleSpace('fault-line-js.streams.pipe', () => {
    const privateSym = Symbol('private');

    function emitFault(...args) {
        this[privateSym].isFaulted = true;

        EventEmitter.prototype.emit.call(this, 'fault', ...args);
    }

    function setupFaultComm() {
        const anonycb = emitFault.bind(this);

        this.on('pipe', (src) => {
            src.on('fault', anonycb);
        });

        this.on('unpipe', (src) => {
            src.removeListener('fault', anonycb);
        });
    }

    function Pipe(...args) {
        if (!(this instanceof Pipe)) {
            return new Pipe(...args);
        }

        let options = null;
        let transform = null;
        let flush = null;

        if (args.length >= 3) {
            options = args[0];
            transform = args[1];
            flush = args[2];
        } else if (args.length === 2) {
            if (_isFunction(args[0])) {
                transform = args[0];
                flush = args[1];
            } else {
                options = args[0];
                transform = args[1];
            }
        } else if (args.length === 1) {
            if (_isFunction(args[0])) {
                transform = args[0];
            } else {
                options = args[0];
            }
        }

        const _options = _isNil(options) ? {} : options;

        this[privateSym] = {
            name: _isNil(_options.name) ? uuid.v4() : _options.name,
            options: _options,
            isFaulted: false,
            reemitErrorsAsFaults: _isNil(_options.reemitErrorsAsFaults) ? true : _options.reemitErrorsAsFaults
        };

        Stream.Transform.call(this, _options);

        if (_isFunction(transform)) {
            this._transform = transform;
        }

        if (_isFunction(flush)) {
            this._flush = flush;
        }

        setupFaultComm.call(this);
    }

    // Pipe.fromStream = function fromStream(stream) {
    //     if ((stream instanceof Pipe) || (stream instanceof Pipeline)) {
    //         Console.warn('Why are you trying to turn an existing pipe/pipeline into a pipe?');
    //
    //         return stream;
    //     }
    // }

    Util.inherits(Pipe, Stream.Transform);

    Pipe.prototype.emit = function emit(event, ...args) {
        if (event !== 'fault') {
            EventEmitter.prototype.emit.call(this, event, ...args);

            if (event !== 'error' || !this[privateSym].reemitErrorsAsFaults) {
                return;
            }
        }

        emitFault.call(this, ...args, this);
    };

    Pipe.prototype.name = function name() {
        return this[privateSym].name;
    };

    Pipe.prototype.isFaulted = function isFaulted() {
        return this[privateSym].isFaulted;
    };

    return Pipe;
});
