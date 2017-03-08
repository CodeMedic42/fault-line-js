/* global it, describe */

import Stream from 'stream';
import Chai from 'chai';
import DirtyChai from 'dirty-chai';
import Pipe from '../../../src/streams/pipe';
import Pipeline from '../../../src/streams/pipeline';

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('fault-line-js Tests', () => {
    describe('Pipeline Tests', () => {
        it('Is function', () => {
            expect(Pipeline).to.be.instanceof(Function);
        });

        it('No options', () => {
            const pipeA = Pipe();
            const pipeB = Pipe();

            const pipeline = Pipeline([pipeA, pipeB]);

            expect(pipeline).to.be.instanceof(Stream);
            expect(pipeline.writable).to.be.true();
            expect(pipeline.readable).to.be.true();
            expect(pipeline._writableState.objectMode).to.be.false();
            expect(pipeline._readableState.objectMode).to.be.false();
            expect(pipeline.name()).to.be.a('string');
            expect(pipeline.isFaulted()).to.be.false();
        });

        it('Object Mode true', () => {
            const pipeA = Pipe({
                objectMode: true
            });
            const pipeB = Pipe({
                objectMode: true
            });

            const pipeline = Pipeline([pipeA, pipeB]);

            expect(pipeline.writable).to.be.true();
            expect(pipeline.readable).to.be.true();
            expect(pipeline._writableState.objectMode).to.be.true();
            expect(pipeline._readableState.objectMode).to.be.true();
        });

        it('Writable Object Mode true', () => {
            const pipeA = Pipe();
            const pipeB = Pipe({
                objectMode: true
            });

            const pipeline = Pipeline([pipeA, pipeB]);

            expect(pipeline.writable).to.be.true();
            expect(pipeline.readable).to.be.true();
            expect(pipeline._writableState.objectMode).to.be.true();
            expect(pipeline._readableState.objectMode).to.be.false();
        });

        it('Readable Object Mode true', () => {
            const pipeA = Pipe({
                objectMode: true
            });
            const pipeB = Pipe();

            const pipeline = Pipeline([pipeA, pipeB]);

            expect(pipeline.writable).to.be.true();
            expect(pipeline.readable).to.be.true();
            expect(pipeline._writableState.objectMode).to.be.false();
            expect(pipeline._readableState.objectMode).to.be.true();
        });

        it('Pipe throws error', () => {
            const pipeA = Pipe();
            const pipeB = Pipe();

            const pipeline = Pipeline([pipeA, pipeB]);

            const expected = 'foo';

            let called = false;

            pipeline.on('error', (err) => {
                called = true;

                expect(err).to.equal(expected);
            });

            pipeA.emit('error', expected);

            expect(called).to.be.true();
        });

        it('Can Take a Pipeline', () => {
            const pipeA = Pipe({
                objectMode: true
            });
            const pipeB = Pipe();
            const pipelineA = Pipeline([pipeA, pipeB]);

            const pipeC = Pipe();
            const pipeD = Pipe({
                objectMode: true
            });
            const pipelineB = Pipeline([pipeC, pipeD]);

            const SuperPipeline = Pipeline([pipelineA, pipelineB]);

            expect(SuperPipeline.writable).to.be.true();
            expect(SuperPipeline.readable).to.be.true();
            expect(SuperPipeline._writableState.objectMode).to.be.true();
            expect(SuperPipeline._readableState.objectMode).to.be.true();
        });

        it('Must be pipes or pipelines', () => {
            let threw = false;

            try {
                Pipeline([{}]);
            } catch (err) {
                threw = true;

                expect(err.message).to.equal('Pipeline cannot only handle instances of Pipe or Pipeline.');
            }

            expect(threw).to.be.true();
        });

        it('Must be an array', () => {
            let threw = false;

            try {
                Pipeline({});
            } catch (err) {
                threw = true;

                expect(err.message).to.equal('Only an array with at least one item is valid.');
            }

            expect(threw).to.be.true();
        });

        it('Must have one item', () => {
            let threw = false;

            try {
                Pipeline([]);
            } catch (err) {
                threw = true;

                expect(err.message).to.equal('Only an array with at least one item is valid.');
            }

            expect(threw).to.be.true();
        });

        it('name is set', () => {
            const pipeA = Pipe();
            const pipeB = Pipe();

            const pipeline = Pipeline([pipeA, pipeB], {
                name: 'foo'
            });

            expect(pipeline.name()).to.equal('foo');
        });

        it('throw error; get fault', () => {
            const pipeA = Pipe();
            const pipeB = Pipe();

            const pipeline = Pipeline([pipeA, pipeB]);

            let errorEmited = false;
            let faultEmited = false;

            pipeline.on('error', (...args) => {
                errorEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
            });

            pipeline.on('fault', (...args) => {
                faultEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
                expect(args[3]).to.equal(pipeline);
            });

            pipeline.emit('error', 'A', 'B', 'C');

            expect(errorEmited, 'Expected error to have been emitted').to.be.true();
            expect(faultEmited, 'Expected fault to have been emitted').to.be.true();
        });

        it('throw error; do not get fault', () => {
            const pipeA = Pipe();
            const pipeB = Pipe();

            const pipeline = Pipeline([pipeA, pipeB], {
                reemitErrorsAsFaults: false
            });

            let errorEmited = false;
            let faultEmited = false;

            pipeline.on('error', (...args) => {
                errorEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
            });

            pipeline.on('fault', () => {
                faultEmited = true;
            });

            pipeline.emit('error', 'A', 'B', 'C');

            expect(errorEmited, 'Expected error to have been emitted').to.be.true();
            expect(faultEmited, 'Fault should not have been emitted').to.be.false();
        });

        it('throw fault; get fault not error', () => {
            const pipeA = Pipe();
            const pipeB = Pipe();

            const pipeline = Pipeline([pipeA, pipeB]);

            let errorEmited = false;
            let faultEmited = false;

            pipeline.on('error', () => {
                errorEmited = true;
            });

            pipeline.on('fault', (...args) => {
                faultEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
                expect(args[3]).to.equal(pipeline);
            });

            pipeline.emit('fault', 'A', 'B', 'C');

            expect(errorEmited, 'Expected error to have been emitted').to.be.false();
            expect(faultEmited, 'Expected fault to have been emitted').to.be.true();
        });
    });
});
