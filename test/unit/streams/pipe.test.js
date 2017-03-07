/* global it, describe */

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
    });
});
