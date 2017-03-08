/* global it, describe */

import Stream from 'stream';
import Chai from 'chai';
import DirtyChai from 'dirty-chai';
import Pipe from '../../../src/streams/pipe';

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('fault-line-js Tests', () => {
    describe('Pipe Tests', () => {
        it('Is function', () => {
            expect(Pipe).to.be.instanceof(Function);
        });

        it('No options', () => {
            const pipe = Pipe();

            expect(pipe).to.be.instanceof(Stream);
            expect(pipe.writable).to.be.true();
            expect(pipe.readable).to.be.true();
            expect(pipe._writableState.objectMode).to.be.false();
            expect(pipe._readableState.objectMode).to.be.false();
            expect(pipe.name()).to.be.a('string');
            expect(pipe.isFaulted()).to.be.false();
            expect(pipe._transform).to.equal(Stream.Transform.prototype._transform);
            expect(pipe._flush).to.not.exist();
        });

        it('With transform function', () => {
            const transform = () => {};

            const pipe = Pipe(transform);

            expect(pipe).to.be.instanceof(Stream);
            expect(pipe.writable).to.be.true();
            expect(pipe.readable).to.be.true();
            expect(pipe._writableState.objectMode).to.be.false();
            expect(pipe._readableState.objectMode).to.be.false();
            expect(pipe.name()).to.be.a('string');
            expect(pipe.isFaulted()).to.be.false();
            expect(pipe._transform).to.equal(transform);
            expect(pipe._flush).to.not.exist();
        });

        it('Object Mode true', () => {
            const pipe = Pipe({
                objectMode: true
            });

            expect(pipe.writable).to.be.true();
            expect(pipe.readable).to.be.true();
            expect(pipe._writableState.objectMode).to.be.true();
            expect(pipe._readableState.objectMode).to.be.true();
        });

        it('Writable Object Mode true', () => {
            const pipe = Pipe({
                writableObjectMode: true
            });

            expect(pipe.writable).to.be.true();
            expect(pipe.readable).to.be.true();
            expect(pipe._writableState.objectMode).to.be.true();
            expect(pipe._readableState.objectMode).to.be.false();
        });

        it('Readable Object Mode true', () => {
            const pipe = Pipe({
                readableObjectMode: true
            });

            expect(pipe.writable).to.be.true();
            expect(pipe.readable).to.be.true();
            expect(pipe._writableState.objectMode).to.be.false();
            expect(pipe._readableState.objectMode).to.be.true();
        });

        it('Options and transformer', () => {
            const transformer = () => {};

            const pipe = Pipe({}, transformer);

            expect(pipe).to.be.instanceof(Stream);
            expect(pipe.writable).to.be.true();
            expect(pipe._writableState.objectMode).to.be.false();
            expect(pipe.name()).to.be.a('string');
            expect(pipe.isFaulted()).to.be.false();
            expect(pipe._transform).to.equal(transformer);
            expect(pipe._flush).to.not.exist();
        });

        it('name is set', () => {
            const pipe = Pipe({
                name: 'foo'
            });

            expect(pipe.name()).to.equal('foo');
        });

        it('throw error; get fault', () => {
            const pipe = Pipe();

            let errorEmited = false;
            let faultEmited = false;

            pipe.on('error', (...args) => {
                errorEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
            });

            pipe.on('fault', (...args) => {
                faultEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
                expect(args[3]).to.equal(pipe);
            });

            pipe.emit('error', 'A', 'B', 'C');

            expect(errorEmited, 'Expected error to have been emitted').to.be.true();
            expect(faultEmited, 'Expected fault to have been emitted').to.be.true();
        });

        it('throw error; do not get fault', () => {
            const pipe = Pipe({
                reemitErrorsAsFaults: false
            });

            let errorEmited = false;
            let faultEmited = false;

            pipe.on('error', (...args) => {
                errorEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
            });

            pipe.on('fault', () => {
                faultEmited = true;
            });

            pipe.emit('error', 'A', 'B', 'C');

            expect(errorEmited, 'Expected error to have been emitted').to.be.true();
            expect(faultEmited, 'Fault should not have been emitted').to.be.false();
        });

        it('throw fault; get fault not error', () => {
            const pipe = Pipe();

            let errorEmited = false;
            let faultEmited = false;

            pipe.on('error', () => {
                errorEmited = true;
            });

            pipe.on('fault', (...args) => {
                faultEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
                expect(args[3]).to.equal(pipe);
            });

            pipe.emit('fault', 'A', 'B', 'C');

            expect(errorEmited, 'Expected error to have been emitted').to.be.false();
            expect(faultEmited, 'Expected fault to have been emitted').to.be.true();
        });
    });
});
