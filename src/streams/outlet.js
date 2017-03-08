import EventEmitter from 'events';
import Stream from 'stream';
import Util from 'util';
import uuid from 'uuid';
import SingleSpace from 'single-space';
import _isNil from 'lodash/isNil';
import _isFunction from 'lodash/isFunction';

export default SingleSpace('fault-line-js.streams.outlet', () => {
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

    function Outlet(...args) {
        if (!(this instanceof Outlet)) {
            return new Outlet(...args);
        }

        let options = null;
        let write = null;

        if (args.length === 2) {
            options = args[0];
            write = args[1];
        } else if (args.length === 1) {
            if (_isFunction(args[0])) {
                write = args[0];
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

        Stream.Writable.call(this, _options);

        setupFaultComm.call(this, _options);

        if (_isFunction(write)) {
            this._write = write;
        }
    }

    Util.inherits(Outlet, Stream.Writable);

    Outlet.prototype.emit = function emit(event, ...args) {
        if (event !== 'fault') {
            EventEmitter.prototype.emit.call(this, event, ...args);

            if (event !== 'error' || !this[privateSym].reemitErrorsAsFaults) {
                return;
            }
        }

        emitFault.call(this, ...args, this);
    };

    Outlet.prototype.name = function name() {
        return this[privateSym].name;
    };

    Outlet.prototype.isFaulted = function isFaulted() {
        return this[privateSym].isFaulted;
    };

    return Outlet;
});
