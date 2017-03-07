import EventEmitter from 'events';
import Stream from 'stream';
import Util from 'util';
import uuid from 'uuid';
import Symbol from 'es6-symbol';
import SingleSpace from 'single-space';
import _isNil from 'lodash/isNil';
import _isFunction from 'lodash/isFunction';

export default SingleSpace('fault-line-js.streams.inlet', () => {
    const privateSym = Symbol('private');

    function emitFault(...args) {
        this[privateSym].isFaulted = true;

        EventEmitter.prototype.emit.call(this, 'fault', ...args);
    }

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
            name: _isNil(_options.name) ? uuid.v4() : _options.name,
            options: _options,
            isFaulted: false,
            reemitErrorsAsFaults: _isNil(_options.reemitErrorsAsFaults) ? true : _options.reemitErrorsAsFaults
        };

        Stream.Readable.call(this, _options);

        if (_isFunction(read)) {
            this._read = read;
        }
    }

    Util.inherits(Inlet, Stream.Readable);

    Inlet.prototype.emit = function emit(event, ...args) {
        if (event !== 'fault') {
            EventEmitter.prototype.emit.call(this, event, ...args);

            if (event !== 'error' || !this[privateSym].reemitErrorsAsFaults) {
                return;
            }
        }

        emitFault.call(this, ...args, this);
    };

    Inlet.prototype._read = function noop() {};

    Inlet.prototype.name = function name() {
        return this[privateSym].name;
    };

    Inlet.prototype.isFaulted = function isFaulted() {
        return this[privateSym].isFaulted;
    };

    return Inlet;
});
