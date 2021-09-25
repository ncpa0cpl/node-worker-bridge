"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.testPromise = void 0;
const testPromise = () => {
    let resolve = () => { };
    let reject = () => { };
    const p = new Promise((rsl, rjc) => {
        resolve = rsl;
        reject = rjc;
    });
    return {
        wait: p,
        resolve,
        reject,
    };
};
exports.testPromise = testPromise;
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}
exports.sleep = sleep;
