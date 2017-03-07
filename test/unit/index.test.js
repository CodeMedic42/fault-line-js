/* global it, describe */

import Chai from 'chai';
import DirtyChai from 'dirty-chai';
import FaultLineJS from '../../src/index';
import Inlet from '../../src/streams/inlet';
import Outlet from '../../src/streams/outlet';
import Insulater from '../../src/streams/insulater';
import Pipe from '../../src/streams/pipe';
import Pipeline from '../../src/streams/pipeline';

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('fault-line-js Tests', () => {
    it('Has correct items', () => {
        expect(FaultLineJS).to.exist();

        expect(FaultLineJS.Inlet).to.equal(Inlet);
        expect(FaultLineJS.Outlet).to.equal(Outlet);
        expect(FaultLineJS.Insulater).to.equal(Insulater);
        expect(FaultLineJS.Pipe).to.equal(Pipe);
        expect(FaultLineJS.Pipeline).to.equal(Pipeline);
    });
});
