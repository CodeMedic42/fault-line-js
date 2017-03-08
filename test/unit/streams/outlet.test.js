/* global it, describe */

import Stream from 'stream';
import Chai from 'chai';
import DirtyChai from 'dirty-chai';
import Outlet from '../../../src/streams/outlet';

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('fault-line-js Tests', () => {
    describe('Outlet Tests', () => {
        it('Is function', () => {
            expect(Outlet).to.be.instanceof(Function);
        });

        it('No options', () => {
            const outlet = Outlet();

            expect(outlet).to.be.instanceof(Stream);
            expect(outlet.writable).to.be.true();
            expect(outlet._writableState.objectMode).to.be.false();
            expect(outlet.name()).to.be.a('string');
            expect(outlet.isFaulted()).to.be.false();
            expect(outlet._write).to.equal(Stream.Writable.prototype._write);
            expect(outlet._flush).to.not.exist();
        });

        it('With write function', () => {
            const writer = () => {};

            const outlet = Outlet(writer);

            expect(outlet).to.be.instanceof(Stream);
            expect(outlet.writable).to.be.true();
            expect(outlet._writableState.objectMode).to.be.false();
            expect(outlet.name()).to.be.a('string');
            expect(outlet.isFaulted()).to.be.false();
            expect(outlet._write).to.equal(writer);
            expect(outlet._flush).to.not.exist();
        });

        it('Object Mode true', () => {
            const outlet = Outlet({
                objectMode: true
            });

            expect(outlet._writableState.objectMode).to.be.true();
        });

        it('Options and writer', () => {
            const writer = () => {};

            const outlet = Outlet({}, writer);

            expect(outlet).to.be.instanceof(Stream);
            expect(outlet.writable).to.be.true();
            expect(outlet._writableState.objectMode).to.be.false();
            expect(outlet.name()).to.be.a('string');
            expect(outlet.isFaulted()).to.be.false();
            expect(outlet._write).to.equal(writer);
            expect(outlet._flush).to.not.exist();
        });

        it('name is set', () => {
            const outlet = Outlet({
                name: 'foo'
            });

            expect(outlet.name()).to.equal('foo');
        });

        it('throw error; get fault', () => {
            const outlet = Outlet();

            let errorEmited = false;
            let faultEmited = false;

            outlet.on('error', (...args) => {
                errorEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
            });

            outlet.on('fault', (...args) => {
                faultEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
                expect(args[3]).to.equal(outlet);
            });

            outlet.emit('error', 'A', 'B', 'C');

            expect(errorEmited, 'Expected error to have been emitted').to.be.true();
            expect(faultEmited, 'Expected fault to have been emitted').to.be.true();
        });

        it('throw error; do not get fault', () => {
            const outlet = Outlet({
                reemitErrorsAsFaults: false
            });

            let errorEmited = false;
            let faultEmited = false;

            outlet.on('error', (...args) => {
                errorEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
            });

            outlet.on('fault', () => {
                faultEmited = true;
            });

            outlet.emit('error', 'A', 'B', 'C');

            expect(errorEmited, 'Expected error to have been emitted').to.be.true();
            expect(faultEmited, 'Fault should not have been emitted').to.be.false();
        });

        it('throw fault; get fault not error', () => {
            const outlet = Outlet();

            let errorEmited = false;
            let faultEmited = false;

            outlet.on('error', () => {
                errorEmited = true;
            });

            outlet.on('fault', (...args) => {
                faultEmited = true;

                expect(args[0]).to.equal('A');
                expect(args[1]).to.equal('B');
                expect(args[2]).to.equal('C');
                expect(args[3]).to.equal(outlet);
            });

            outlet.emit('fault', 'A', 'B', 'C');

            expect(errorEmited, 'Expected error to have been emitted').to.be.false();
            expect(faultEmited, 'Expected fault to have been emitted').to.be.true();
        });
    });
});
