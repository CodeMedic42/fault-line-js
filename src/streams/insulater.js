import util from 'util';
import Symbol from 'es6-symbol';
import Promise from 'bluebird';
import SingleSpace from 'single-space';
import _isNil from 'lodash/isNil';
import _isFunction from 'lodash/isFunction';

import Pipe from './pipe';

export default SingleSpace('fault-line-js.streams.insulater', () => {
    const privateSym = Symbol('private');

    function pushValue(result) {
        return Promise.resolve(result).then((promResult) => {
            // Do not return something that does not exist.
            if (!_isNil(promResult)) {
                this.push(promResult);
            }
        });
    }

    function processItem(func) {
        const tryRun = Promise.try(() => {
            return pushValue.call(this, func());
        }).catch((err) => {
            this.emit('error', err);
        });

        this[privateSym].promises.push(tryRun);
    }

    function Insulater(insulatee, options) {
        if (!(this instanceof Insulater)) {
            return new Insulater(insulatee, options);
        }

        if (_isNil(insulatee)) {
            throw new Error('Must provide an insulatee');
        }

        if (!_isFunction(insulatee.run)) {
            throw new Error('Must insulatee provide a run function');
        }

        Pipe.call(this, options);

        this[privateSym] = {
            promises: [],
            insulatee
        };

        if (_isFunction(insulatee.init)) {
            processItem.call(this, () => {
                return insulatee.init();
            });
        }
    }

    util.inherits(Insulater, Pipe);

    Insulater.prototype._transform = function _transform(data, enc, next) {
        processItem.call(this, () => {
            return this[privateSym].insulatee.run(data);
        });

        // Do not wait just go get next. The Promise system will handle the processing.
        next();
    };

    Insulater.prototype._flush = function _flush(done) {
        if (!_isFunction(this[privateSym].insulatee.finish)) {
            done();

            return;
        }

        Promise.try(() => {
            // Execute Finish
            const result = this[privateSym].insulatee.finish();

            // But wait for the rest of the promisies to complete.
            // It is possible the other promisses were waiting for finish to be called so that they can complete.
            // This is why we execute finish outside of the the Promise.all call.
            return Promise.all(this[privateSym].promises).then(() => {
                // Ok handle the result of finish.
                return pushValue.call(this, result);
            });
        }).catch((err) => {
            this.emit('error', err);
        }).finally(() => {
            done();
        });
    };

    return Insulater;
});
