/* global it, describe */

import Chai from 'chai';
import DirtyChai from 'dirty-chai';
import Promise from 'bluebird';
import Insulater from '../../../src/streams/insulater';
import Pipe from '../../../src/streams/pipe';
import Outlet from '../../../src/streams/outlet';

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('fault-line-js Tests', () => {
    describe('Insulator Tests', () => {
        it('Is function', () => {
            expect(Insulater).to.be.instanceof(Function);
        });

        it('Is instance of Pipe', () => {
            expect(Insulater({
                run: () => {}
            })).to.be.instanceof(Pipe);
        });

        it('Start is called', () => {
            return new Promise((resolve, reject) => {
                const insulated = Insulater({
                    start: () => { return 'foo'; },
                    run: () => {}
                });

                const outlet = Outlet((data, enc, next) => {
                    expect(data.toString()).to.equal('foo');

                    next();
                }).on('finish', () => {
                    resolve();
                });

                insulated.pipe(outlet).on('fault', (err) => {
                    reject(err);
                });

                insulated.end();
            });
        });
    });
});
