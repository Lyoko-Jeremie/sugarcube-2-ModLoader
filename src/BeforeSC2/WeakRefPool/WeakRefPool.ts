export function newWeakPoolRef<T>(v: T) {
    return new WeakPoolRef<T>();
}

export class WeakPoolRef<T> {
    constructor(
        // parent: WeakRefPool<T>,
    ) {
        // this.deref = () => {
        //     return parent.pool.get(this);
        // }
    }

    get deref(): T | undefined {
        return instanceWeakRefPool.pool.get(this);
    }
}

export class WeakRefPool<T> {
    pool: WeakMap<WeakPoolRef<T>, T> = new WeakMap<WeakPoolRef<T>, T>();
}

let instanceWeakRefPool = new WeakRefPool<any>();
