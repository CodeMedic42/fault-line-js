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
                yeild: () => { throw new Error('Should not have called yeild'); }
            })).to.be.instanceof(Pipe);
        });

        it('Start is called', () => {
            return new Promise((resolve, reject) => {
                const insulated = Insulater({
                    start: () => { return 'foo'; },
                    yeild: () => { throw new Error('Should not have called yeild'); }
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

        it('Start and yeild and finish are called', () => {
            return new Promise((resolve, reject) => {
                const insulated = Insulater({
                    start: () => { return 'foo'; },
                    yeild: () => { return 'bar'; },
                    finish: () => { return 'baz'; }
                });

                let expected = 'foo';

                const outlet = Outlet((data, enc, next) => {
                    expect(data.toString()).to.equal(expected);

                    expected = expected === 'foo' ? 'bar' : 'baz';

                    next();
                }).on('finish', () => {
                    resolve();
                });

                insulated.pipe(outlet).on('fault', (err) => {
                    reject(err);
                });

                insulated.write('42');
                insulated.end();
            });
        });

        it('Start and yeild and finish return null', () => {
            return new Promise((resolve, reject) => {
                const insulated = Insulater({
                    start: () => { return null; },
                    yeild: () => { return null; },
                    finish: () => { return null; }
                });

                const outlet = Outlet(() => {
                    throw new Error('Should not have been called');
                }).on('finish', () => {
                    resolve();
                });

                insulated.pipe(outlet).on('fault', (err) => {
                    reject(err);
                });

                insulated.write('42');
                insulated.end();
            });
        });

        it('Start throws', () => {
            return new Promise((resolve, reject) => {
                const insulated = Insulater({
                    start: () => { throw new Error('fail'); },
                    yeild: () => { reject('Should not have called yeild'); }
                });

                insulated.on('error', (err) => { expect(err.message).to.equal('fail'); });

                const outlet = Outlet((data, enc, next) => {
                    next();
                }).on('finish', () => {
                    resolve();
                });

                insulated.pipe(outlet);

                insulated.end();
            });
        });

        it('Run throws', () => {
            return new Promise((resolve) => {
                const insulated = Insulater({
                    yeild: () => { throw new Error('fail'); }
                });

                insulated.on('error', (err) => { expect(err.message).to.equal('fail'); });

                const outlet = Outlet((data, enc, next) => {
                    next();
                }).on('finish', () => {
                    resolve();
                });

                insulated.pipe(outlet);

                insulated.end();
            });
        });

        it('Finish throws', () => {
            return new Promise((resolve, reject) => {
                const insulated = Insulater({
                    yeild: () => { reject('Should not have called yeild'); },
                    finish: () => { throw new Error('fail'); }
                });

                insulated.on('error', (err) => { expect(err.message).to.equal('fail'); });

                const outlet = Outlet((data, enc, next) => {
                    next();
                }).on('finish', () => {
                    resolve();
                });

                insulated.pipe(outlet);

                insulated.end();
            });
        });

        it('Insulatee null', () => {
            let threw = false;

            try {
                Insulater(null);
            } catch (err) {
                threw = true;

                expect(err.message).to.equal('Must provide an insulatee');
            }

            expect(threw).to.be.true();
        });

        it('Insulatee yeild null', () => {
            let threw = false;

            try {
                Insulater({});
            } catch (err) {
                threw = true;

                expect(err.message).to.equal('Must insulatee provide a yeild function');
            }

            expect(threw).to.be.true();
        });

        it('Insulatee yeild not function', () => {
            let threw = false;

            try {
                Insulater({
                    yeild: {}
                });
            } catch (err) {
                threw = true;

                expect(err.message).to.equal('Must insulatee provide a yeild function');
            }

            expect(threw).to.be.true();
        });
    });
});
