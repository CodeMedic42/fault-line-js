/* global it, describe */

import Chai from 'chai';
import DirtyChai from 'dirty-chai';
import Pipeline from '../../../src/streams/pipeline';

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('fault-line-js Tests', () => {
    describe('Pipeline Tests', () => {
        it('Is function', () => {
            expect(Pipeline).to.be.instanceof(Function);
        });
    });
});
