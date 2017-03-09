/* global it, describe */

import Chai from 'chai';
import DirtyChai from 'dirty-chai';
import Inlet from '../../src/streams/inlet';
import Outlet from '../../src/streams/outlet';
import Pipe from '../../src/streams/pipe';
import Pipeline from '../../src/streams/pipeline';

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('fault-line-js Tests', () => {
    describe('Connection Tests', () => {
        beforeEach(function setup() {
            const expectedFaultValue = 'foo';
            let inlet;
            const callers = [];

            function onFault(fault, source) {
                expect(fault).to.equal(expectedFaultValue);
                expect(source).to.equal(inlet);

                callers.push(this.name());
            }

            inlet = Inlet({ name: 'inlet' }).on('fault', onFault);
            const pipeA = Pipe({ name: 'pipeA' }, (data, enc, next) => { pipeA.push(`${data.toString()}_pipeA`); next(); }).on('fault', onFault);
            const pipeB = Pipe({ name: 'pipeB' }, (data, enc, next) => { pipeB.push(`${data.toString()}_pipeB`); next(); }).on('fault', onFault);
            const pipeline = Pipeline([pipeA, pipeB], { name: 'pipeline' }).on('fault', onFault);
            const outlet = Outlet({ name: 'outlet' }, (data, enc, next) => { expect(data.toString()).to.equal('start_pipeA_pipeB'); next(); }).on('fault', onFault).on('finish', () => { this.endTest(); });

            inlet
            .pipe(pipeline)
            .pipe(outlet);

            this.callers = callers;
            this.inlet = inlet;
            this.pipeA = pipeA;
            this.pipeB = pipeB;
            this.pipeline = pipeline;
            this.outlet = outlet;
        });

        it('Fault propogates correctly.', function test() {
            this.inlet.emit('fault', 'foo');

            expect(this.callers[0]).to.equal('inlet');
            expect(this.callers[1]).to.equal('pipeA');
            expect(this.callers[2]).to.equal('pipeB');
            expect(this.callers[3]).to.equal('pipeline');
            expect(this.callers[4]).to.equal('outlet');
        });

        it('Fault does not propogate when outlet is unpiped.', function test() {
            this.pipeline.unpipe();

            this.inlet.emit('fault', 'foo');

            expect(this.callers[0]).to.equal('inlet');
            expect(this.callers[1]).to.equal('pipeA');
            expect(this.callers[2]).to.equal('pipeB');
            expect(this.callers[3]).to.equal('pipeline');
            expect(this.callers[4]).to.not.exist();
        });

        it('Fault does not propogate when pipeline is unpiped.', function test() {
            this.inlet.unpipe();

            this.inlet.emit('fault', 'foo');

            expect(this.callers[0]).to.equal('inlet');
            expect(this.callers[1]).to.not.exist();
            expect(this.callers[2]).to.not.exist();
            expect(this.callers[3]).to.not.exist();
            expect(this.callers[4]).to.not.exist();
        });

        it('Fault does not propogate when pipeB is unpiped.', function test() {
            this.pipeA.unpipe();

            this.inlet.emit('fault', 'foo');

            expect(this.callers[0]).to.equal('inlet');
            expect(this.callers[1]).to.equal('pipeA');
            expect(this.callers[2]).to.not.exist();
            expect(this.callers[3]).to.not.exist();
            expect(this.callers[4]).to.not.exist();
        });

        it('Data passes correctly', function test(endTest) {
            this.endTest = endTest;

            this.inlet.push('start');
            this.inlet.push(null);
        });
    });
});
