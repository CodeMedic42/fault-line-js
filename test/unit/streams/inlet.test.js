/* global it, describe */

import Stream from 'stream';
import Chai from 'chai';
import DirtyChai from 'dirty-chai';
import Inlet from '../../../src/streams/inlet';

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('fault-line-js Tests', () => {
    describe('Inlet Tests', () => {
        it('Is function', () => {
            expect(Inlet).to.be.instanceof(Function);
        });

        it('No options', () => {
            const inlet = Inlet();

            expect(inlet).to.be.instanceof(Stream);
            expect(inlet.readable).to.be.true();
            expect(inlet._readableState.objectMode).to.be.false();
            expect(inlet.name()).to.be.a('string');
            expect(inlet.isFaulted()).to.be.false();
            expect(inlet._read).to.not.be.null();
        });

        it('With read function', () => {
            const reader = () => {};

            const inlet = Inlet(reader);

            expect(inlet).to.be.instanceof(Stream);
            expect(inlet.readable).to.be.true();
            expect(inlet._readableState.objectMode).to.be.false();
            expect(inlet.name()).to.be.a('string');
            expect(inlet.isFaulted()).to.be.false();
            expect(inlet._read).to.equal(reader);
        });

        it('Object Mode true', () => {
            const inlet = Inlet({
                objectMode: true
            });

            expect(inlet._readableState.objectMode).to.be.true();
        });

        it('Options and reader', () => {
            const reader = () => {};

            const inlet = Inlet({}, reader);

            expect(inlet).to.be.instanceof(Stream);
            expect(inlet.readable).to.be.true();
            expect(inlet._readableState.objectMode).to.be.false();
            expect(inlet.name()).to.be.a('string');
            expect(inlet.isFaulted()).to.be.false();
            expect(inlet._read).to.equal(reader);
        });

        it('name is set', () => {
            const inlet = Inlet({
                name: 'foo'
            });

            expect(inlet.name()).to.equal('foo');
        });

        it('throw error; get fault', () => {
            const inlet = Inlet();

            let errorEmited = false;
            let faultEmited = false;

            inlet.on('error', (...args) => {
                errorEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
            });

            inlet.on('fault', (...args) => {
                faultEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
                expect(args[3]).to.equal(inlet);
            });

            inlet.emit('error', 'A', 'B', 'C');

            expect(errorEmited, 'Expected error to have been emitted').to.be.true();
            expect(faultEmited, 'Expected fault to have been emitted').to.be.true();
        });

        it('throw error; do not get fault', () => {
            const inlet = Inlet({
                reemitErrorsAsFaults: false
            });

            let errorEmited = false;
            let faultEmited = false;

            inlet.on('error', (...args) => {
                errorEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
            });

            inlet.on('fault', () => {
                faultEmited = true;
            });

            inlet.emit('error', 'A', 'B', 'C');

            expect(errorEmited, 'Expected error to have been emitted').to.be.true();
            expect(faultEmited, 'Fault should not have been emitted').to.be.false();
        });

        it('throw fault; get fault not error', () => {
            const inlet = Inlet();

            let errorEmited = false;
            let faultEmited = false;

            inlet.on('error', () => {
                errorEmited = true;
            });

            inlet.on('fault', (...args) => {
                faultEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
                expect(args[3]).to.equal(inlet);
            });

            inlet.emit('fault', 'A', 'B', 'C');

            expect(errorEmited, 'Expected error to have been emitted').to.be.false();
            expect(faultEmited, 'Expected fault to have been emitted').to.be.true();
        });

        it('Push Something', () => {
            const inlet = Inlet({
                objectMode: true
            });

            inlet.push('thing');
        });
    });
});
