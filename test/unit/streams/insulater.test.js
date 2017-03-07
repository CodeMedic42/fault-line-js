/* global it, describe */

import Chai from 'chai';
import DirtyChai from 'dirty-chai';
import Insulater from '../../../src/streams/insulater';

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('fault-line-js Tests', () => {
    describe('Insulator Tests', () => {
        it('Is function', () => {
            expect(Insulater).to.be.instanceof(Function);
        });
    });
});
