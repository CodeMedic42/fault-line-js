import Util from 'util';
import Symbol from 'es6-symbol';
import Promise from 'bluebird';
import SingleSpace from 'single-space';
import _isNil from 'lodash/isNil';
import _isFunction from 'lodash/isFunction';

import Pipe from './pipe';

export default SingleSpace('fault-line-js.streams.insulater', () => {
    const privateSym = Symbol('private');

    /**
     * [pushValue description]
     *
     * @param  {any} result The result to push onto the stream. If this is another promise then the result of this promise will be pushed instread.
     *
     * @return {Promise} A promise which when resolve will push the result onto the stream.
     */
    function pushValue(result) {
        return Promise.resolve(result).then((promResult) => {
            // Do not return something that does not exist.
            if (!_isNil(promResult)) {
                this.push(promResult);
            }
        });
    }

    /**
     * Run the function that is passed and wrap in promises.
     *
     * @param  {function} func The function to call, the result of which will be handled and eventualy put on the stream.
     */
    function processItem(func) {
        const tryRun = Promise.try(() => {
            // If this throws or the promise is rejected then it should ...
            return pushValue.call(this, func());
        }).catch((err) => {
            // ... be caught here
            this.emit('error', err);
        });

        // We need to maintain a the working promises so that flush is processed in the correct order.
        this[privateSym].promises.push(tryRun);
    }

    /**
     * Takes the Pipe stream and removes the stream endpoints and provides a better asynbc api to use with promises.
     *
     * @param {object} insulatee An object which has defined a function "yeild" and optionaly defined functions "start" and "finish".
     * @param {Pipe.options} [options] The same options which can be passed to {Pipe}.
     *
     * @constructs Insulater
     *
     * @extends Pipe
     */
    function Insulater(insulatee, options) {
        if (!(this instanceof Insulater)) {
            return new Insulater(insulatee, options);
        }

        if (_isNil(insulatee)) {
            throw new Error('Must provide an insulatee');
        }

        if (!_isFunction(insulatee.yeild)) {
            throw new Error('Must insulatee provide a yeild function');
        }

        Pipe.call(this, options);

        this[privateSym] = {
            promises: [],
            insulatee
        };

        if (_isFunction(insulatee.start)) {
            processItem.call(this, () => {
                return insulatee.start();
            });
        }
    }

    Util.inherits(Insulater, Pipe);

    /**
     * The _transform function which is required for any transform stream. Do not override.
     *
     * @param  {any}   data The data coming down the stream from the writeable side.
     * @param  {string}   enc  The encoding type of data. Meaning if writableObectMode mode is set to true.
     * @param  {function} next The function to call when the next value can be requested.
     */
    Insulater.prototype._transform = function _transform(data, enc, next) {
        processItem.call(this, () => {
            return this[privateSym].insulatee.yeild(data);
        });

        // Do not wait just go get next. The Promise system will handle the processing.
        next();
    };

    /**
     * If finish is define by the insulatee then it is called here. Either way this will wait for all promises to finish before finalizing the stream. Each Error or rejection will result in an error being emitted.
     *
     * @param  {function} done The function to call when the finish function is completed is completed and all other promises have completed successfuly or not..
     */
    Insulater.prototype._flush = function _flush(done) {
        let finalPromise;

        if (!_isFunction(this[privateSym].insulatee.finish)) {
            finalPromise = Promise.all(this[privateSym].promises);
        } else {
            finalPromise = Promise.try(() => {
                // Execute Finish
                const result = this[privateSym].insulatee.finish();

                // But wait for the rest of the promisies to complete.
                // It is possible the other promisses were waiting for finish to be called so that they can complete.
                // This is why we execute finish outside of the the Promise.all call.
                return Promise.all(this[privateSym].promises).then(() => {
                    // Ok handle the result of finish.
                    return pushValue.call(this, result);
                });
            });
        }

        // Catch any other errors or rejections from all promises that have been created and then emit them.
        finalPromise.catch((errs) => {
            this.emit('error', errs);
        }).finally(() => {
            done();
        });
    };

    return Insulater;
});
