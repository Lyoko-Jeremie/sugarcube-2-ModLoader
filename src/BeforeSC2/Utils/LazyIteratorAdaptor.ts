export class LazyIteratorAdaptor {

    public static find<T>(iterator: Iterator<T>, predicate: (value: T, index: number) => boolean): T | undefined {
        let i = 0;
        let result = iterator.next();
        while (!result.done) {
            if (predicate(result.value, i++)) {
                return result.value;
            }
            result = iterator.next();
        }
        return undefined;
    }

    public static findIndex<T>(iterator: Iterator<T>, predicate: (value: T, index: number) => boolean): number {
        let i = 0;
        let result = iterator.next();
        while (!result.done) {
            if (predicate(result.value, i++)) {
                return i - 1;
            }
            result = iterator.next();
        }
        return -1;
    }

    public static some<T>(iterator: Iterator<T>, predicate: (value: T, index: number) => boolean): boolean {
        let i = 0;
        let result = iterator.next();
        while (!result.done) {
            if (predicate(result.value, i++)) {
                return true;
            }
            result = iterator.next();
        }
        return false;
    }

    public static every<T>(iterator: Iterator<T>, predicate: (value: T, index: number) => boolean): boolean {
        let i = 0;
        let result = iterator.next();
        while (!result.done) {
            if (!predicate(result.value, i++)) {
                return false;
            }
            result = iterator.next();
        }
        return true;
    }

    public static filter<T>(iterator: Iterator<T>, predicate: (value: T, index: number) => boolean): T[] {
        let i = 0;
        let result = iterator.next();
        const resultArray: T[] = [];
        while (!result.done) {
            if (predicate(result.value, i++)) {
                resultArray.push(result.value);
            }
            result = iterator.next();
        }
        return resultArray;
    }

    public static* filterLazy<T>(iterator: Iterator<T>, predicate: (value: T, index: number) => boolean): Generator<T> {
        let i = 0;
        let result = iterator.next();
        while (!result.done) {
            if (predicate(result.value, i++)) {
                yield result.value;
            }
            result = iterator.next();
        }
    }

    public static map<T, U>(iterator: Iterator<T>, mapper: (value: T, index: number) => U): U[] {
        let i = 0;
        let result = iterator.next();
        const resultArray: U[] = [];
        while (!result.done) {
            resultArray.push(mapper(result.value, i++));
            result = iterator.next();
        }
        return resultArray;
    }

    public static* mapLazy<T, U>(iterator: Iterator<T>, callback: (value: T, index: number) => U): Generator<U> {
        let i = 0;
        let result = iterator.next();
        while (!result.done) {
            yield callback(result.value, i++);
            result = iterator.next();
        }
    }

    public static reduce<T, U>(iterator: Iterator<T>, reducer: (accumulator: U, value: T, index: number) => U, initialValue: U): U {
        let i = 0;
        let result = iterator.next();
        let accumulator = initialValue;
        while (!result.done) {
            accumulator = reducer(accumulator, result.value, i++);
            result = iterator.next();
        }
        return accumulator;
    }

}

LazyIteratorAdaptor.find([1, 2, 3, 4, 5].values(), v => v > 3); // 4
LazyIteratorAdaptor.findIndex([1, 2, 3, 4, 5].values(), v => v > 3); // 3
LazyIteratorAdaptor.some([1, 2, 3, 4, 5].values(), v => v > 3); // true
LazyIteratorAdaptor.every([1, 2, 3, 4, 5].values(), v => v > 3); // false
LazyIteratorAdaptor.filter([1, 2, 3, 4, 5].values(), v => v > 3); // [4, 5]
Array.from(LazyIteratorAdaptor.filterLazy([1, 2, 3, 4, 5].values(), v => v > 3)); // [4, 5]
LazyIteratorAdaptor.map([1, 2, 3, 4, 5].values(), v => v * 2); // [2, 4, 6, 8, 10]
Array.from(LazyIteratorAdaptor.mapLazy([1, 2, 3, 4, 5].values(), v => v * 2)); // [2, 4, 6, 8, 10]
LazyIteratorAdaptor.reduce([1, 2, 3, 4, 5].values(), (acc, v) => acc + v, 0); // 15

// console.log('window.LazyIteratorAdaptor = LazyIteratorAdaptor');
// @ts-ignore
window.LazyIteratorAdaptor = LazyIteratorAdaptor;

;(() => {
    try {
        // test if it is working (maybe on chrome)
        // @ts-ignore
        [1, 2, 3, 4, 5].values().reduce((acc, v) => acc + v, 0);
    } catch (e) {
        // need patch it (maybe in firefox)
    }
})();

