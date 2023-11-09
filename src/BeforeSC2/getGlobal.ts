var check = function (it: any) {
    return it && it.Math === Math && it;
};

// console.log('getGlobal()', [
//     typeof globalThis == 'object' && globalThis,
//     typeof window == 'object' && window,
//     typeof self == 'object' && self,
//     typeof global == 'object' && global,
// ]);

export function getGlobal() {
    return check(typeof globalThis == 'object' && globalThis) ||
        check(typeof window == 'object' && window) ||
        check(typeof self == 'object' && self) ||
        check(typeof global == 'object' && global) ||
        (function () {
            // @ts-ignore
            return this;
            // @ts-ignore
        })() || this || Function('return this')();
}

