import {ModZipReader} from "./ModZipReader";
import {ModDataLoadType, ModInfo} from "./ModLoader";
import {
    every,
    get,
    has,
    isArray,
    isObject,
    isPlainObject,
    isString,
    cloneDeep,
    clone,
    uniq,
    uniqBy,
    orderBy,
    isEqualWith,
    isMap,
    isFunction,
    isNil,
} from 'lodash';

export enum ModLoadFromSourceType {
    'Remote' = 'Remote',
    'Local' = 'Local',
    'LocalStorage' = 'LocalStorage',
    'IndexDB' = 'IndexDB',
    'SideLazy' = 'SideLazy',
}


export function isModOrderItem(a: any): a is ModOrderItem {
    return a
        && isString(a.name)
        && isObject(a.mod)
        && isObject(a.zip)
        && !isNil(a.from)
        ;
}

export interface ModOrderItem {
    name: string;
    from: ModLoadFromSourceType;
    mod: ModInfo;
    zip: ModZipReader;
}

class CustomIterableIterator<T, Parent, CacheType> implements IterableIterator<T> {
    index = 0;

    constructor(
        public parent: Parent,
        public nextF: (index: number, p: Parent, ito: CustomIterableIterator<T, Parent, CacheType>) => IteratorResult<T>,
        public cache: CacheType,
    ) {
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this;
    }

    next(...args: [] | [undefined]): IteratorResult<T> {
        const r = this.nextF(
            this.index,
            this.parent,
            this
        );
        ++this.index;
        return r;
    }
}

abstract class CustomReadonlyMapHelper<K, V> implements ReadonlyMap<K, V> {

    abstract get size(): number;

    abstract get(key: K): V | undefined;

    abstract has(key: K): boolean;

    abstract entries(): IterableIterator<[K, V]>;

    [Symbol.iterator](): IterableIterator<[K, V]> {
        return this.entries();
    }

    forEach(callback: (value: V, key: K, map: ReadonlyMap<K, V>) => void, thisArg?: any): void {
        for (const nn of this.entries()) {
            callback(this.get(nn[0])!, nn[0], this);
        }
    }

    keys(): IterableIterator<K> {
        return new CustomIterableIterator<K, typeof this, [K, V][]>(
            this,
            (index, p, ito) => {
                return {
                    done: index >= this.size,
                    value: ito.cache[index]?.[0],
                };
            },
            Array.from(this.entries()),
        );
    }

    values(): IterableIterator<V> {
        return new CustomIterableIterator<V, typeof this, [K, V][]>(
            this,
            (index, p, ito) => {
                return {
                    done: index >= this.size,
                    value: ito.cache[index]?.[1],
                };
            },
            Array.from(this.entries()),
        );
    }

}

export class ModOrderContainer_One_ReadonlyMap extends CustomReadonlyMapHelper<string, ModOrderItem> {
    constructor(
        public parent: ModOrderContainer,
    ) {
        super();
        parent.checkNameUniq();
    }

    get size() {
        return this.parent.container.size;
    };

    entries(): IterableIterator<[string, ModOrderItem]> {
        return new CustomIterableIterator<[string, ModOrderItem], ModOrderContainer, string[]>(
            this.parent,
            (index, p, ito) => {
                if (index >= p.container.size) {
                    return {done: true, value: undefined};
                } else {
                    const it = ito.cache[index];
                    const itt = this.get(it);
                    // console.log('entries()', index, it, itt);
                    if (!it || !itt) {
                        console.error('entries() (!it || !itt)', index, it, itt);
                        throw new Error('entries() (!it || !itt)');
                    }
                    return {done: false, value: [it, itt]};
                }
            },
            Array.from(this.parent.container.keys()),
        );
    }

    get(key: string): ModOrderItem | undefined {
        return this.parent.container.get(key)?.values().next().value;
    }

    has(key: string): boolean {
        return this.parent.container.has(key) && this.parent.container.get(key)!.size > 0;
    }

}

export function isModOrderContainer(a: any): a is ModOrderContainer {
    return a
        && isArray(a.order)
        && isMap(a.container)
        && isFunction(a.checkData)
        ;
}

/**
 * a multi-index container designed for mod load cache list. work like a C++ Boost.MultiIndexContainer
 * can keep mod `order` , optional keep mod `unique` , remember mod load `from source`
 */
export class ModOrderContainer {
    // keep unique key<name-from>, means a name have multi mod, but no multi mod from same source if there have same name.
    container: Map<string, Map<ModLoadFromSourceType, ModOrderItem>> = new Map<string, Map<ModLoadFromSourceType, ModOrderItem>>();
    // keep order
    order: ModOrderItem[] = [];

    constructor() {
    }

    /**
     * O(1)
     *
     * add addition limit that keep mod name unique
     */
    get_One_Map(): ModOrderContainer_One_ReadonlyMap {
        return new ModOrderContainer_One_ReadonlyMap(this);
    }

    /**
     * O(2n)
     *
     * add addition limit that keep mod name unique
     */
    get_One_Array(): ModOrderItem[] {
        this.checkNameUniq();
        return uniqBy(this.order, T => T.name);
    }

    /**
     * O(n)
     */
    get_Array(): ModOrderItem[] {
        return clone(this.order);
    }

    /**
     * O(1)
     */
    getHasByName(name: string): boolean {
        return this.container.has(name) && this.container.get(name)!.size > 0;
    }

    /**
     * O(1)
     */
    getHasByNameFrom(name: string, from: ModLoadFromSourceType): boolean {
        return this.container.has(name) && this.container.get(name)!.has(from);
    }

    /**
     * O(1)
     */
    getByName(name: string): Map<ModLoadFromSourceType, ModOrderItem> | undefined {
        return this.container.get(name);
    }

    /**
     * O(1)
     */
    getByNameOne(name: string, noError = false): ModOrderItem | undefined {
        this.checkNameUniq();
        const nn = this.container.get(name);
        if (!nn) {
            if (noError) {
                return undefined;
            }
            console.error('ModOrderContainer getByNameOne() cannot find name.', [name, this.clone()]);
            return undefined;
        }
        if (nn.size > 1) {
            console.error('ModOrderContainer getByNameOne() has more than one mod.', [name, nn]);
        }
        return nn.values().next().value;
    }

    /**
     * O(n)
     */
    getByOrder(name: string): ModOrderItem[] {
        return this.order.filter(T => T.name === name);
    }

    /**
     * O(n)
     */
    checkNameUniq(): boolean {
        for (const [name, m] of this.container) {
            if (m.size > 1) {
                console.error('ModOrderContainer checkNameUniq() name not uniq.', [name, m]);
                return false;
            }
        }
        return true;
    }

    /**
     * O(n+2log(n))
     */
    checkData(): boolean {
        // covert container to order , sort it, then compare order one-by-one to check container==order
        const order: ModOrderItem[] = [];
        for (const [name, m] of this.container) {
            for (const [from, item] of m) {
                order.push(item);
                if (item.name !== name || item.from !== from) {
                    console.error('ModOrderContainer checkData() failed. inner data modify.', [item, name, from]);
                    return false;
                }
            }
        }
        const order1: ModOrderItem[] = orderBy(order, ['name', 'from'], ['asc', 'asc']);
        const order2: ModOrderItem[] = orderBy(this.order, ['name', 'from'], ['asc', 'asc']);
        if (!isEqualWith(order1, order2, (a, b) => a.name === b.name && a.from === b.from)) {
            console.error('ModOrderContainer checkData() failed.', [order1, order2]);
            return false;
        }
        return true;
    }

    /**
     * O(n)
     */
    delete(name: string, from: ModLoadFromSourceType): boolean {
        const m = this.container.get(name);
        if (m) {
            if (m.has(from)) {
                m.delete(from);
                if (m.size === 0) {
                    this.container.delete(name);
                }
                this.order = this.order.filter(T => T.name !== name && T.from !== from);
                this.checkData();
                return true;
            }
        }
        return false;
    }

    /**
     * O(n)
     */
    deleteAll(name: string): boolean {
        const m = this.container.get(name);
        if (m) {
            this.container.delete(name);
            this.order = this.order.filter(T => T.name !== name);
            this.checkData();
            return true;
        }
        return false;
    }

    /**
     * O(1)
     */
    createModOrderItem(zip: ModZipReader, from: ModLoadFromSourceType): ModOrderItem | undefined {
        if (!zip.modInfo) {
            console.error('ModOrderContainer createModOrderItem() zip.modInfo not found.', [zip]);
            return undefined;
        }
        return {
            name: zip.modInfo.name,
            from: from,
            mod: zip.modInfo,
            zip: zip,
        };
    }

    /**
     * O(2n)
     */
    pushFront(zip: ModZipReader, from: ModLoadFromSourceType): boolean {
        const obj = this.createModOrderItem(zip, from);
        if (!obj) {
            console.error('ModOrderContainer pushFront() createModOrderItem() failed.', [zip, from]);
            return false;
        }
        if (!this.container.has(obj.name)) {
            this.container.set(obj.name, new Map<ModLoadFromSourceType, ModOrderItem>());
        }
        const m = this.container.get(obj.name)!;
        m.set(obj.from, obj);
        const ii = this.order.findIndex(T => T.name === obj.name && T.from === obj.from);
        if (ii >= 0) {
            this.order.splice(ii, 1);
        }
        this.order = [obj, ...this.order];
        this.checkData();
        return true;
    }

    /**
     * O(2n)
     */
    pushBack(zip: ModZipReader, from: ModLoadFromSourceType): boolean {
        const obj = this.createModOrderItem(zip, from);
        if (!obj) {
            console.error('ModOrderContainer pushBack() createModOrderItem() failed.', [zip, from]);
            return false;
        }
        if (!this.container.has(obj.name)) {
            this.container.set(obj.name, new Map<ModLoadFromSourceType, ModOrderItem>());
        }
        const m = this.container.get(obj.name)!;
        m.set(obj.from, obj);
        const ii = this.order.findIndex(T => T.name === obj.name && T.from === obj.from);
        if (ii >= 0) {
            this.order.splice(ii, 1);
        }
        this.order.push(obj);
        this.checkData();
        return true;
    }

    /**
     * O(2n)
     */
    insertReplace(zip: ModZipReader, from: ModLoadFromSourceType): boolean {
        const obj = this.createModOrderItem(zip, from);
        if (!obj) {
            console.error('ModOrderContainer insertReplace() createModOrderItem() failed.', [zip, from]);
            return false;
        }
        if (!this.container.has(obj.name)) {
            this.container.set(obj.name, new Map<ModLoadFromSourceType, ModOrderItem>());
        }
        const m = this.container.get(obj.name)!;
        m.set(obj.from, obj);
        const ii = this.order.findIndex(T => T.name === obj.name && T.from === obj.from);
        if (ii >= 0) {
            this.order.splice(ii, 0, obj);
        }
        this.checkData();
        return true;
    }

    /**
     * O(n)
     */
    popOut(name: string, from: ModLoadFromSourceType): ModOrderItem | undefined {
        const m = this.container.get(name);
        if (m) {
            const n = m.get(from);
            if (!!n) {
                m.delete(n.from);
                if (m.size === 0) {
                    this.container.delete(name);
                }
                this.order = this.order.filter(T => T.name !== n.name && T.from !== n.from);
                this.checkData();
                return n;
            }
        }
        return undefined;
    }

    /**
     * O(n)
     */
    popOutAll(name: string): ModOrderItem[] | undefined {
        const m = this.container.get(name);
        if (m) {
            this.container.delete(name);
            this.order = this.order.filter(T => T.name !== name);
            this.checkData();
            return Array.from(m.values());
        }
        return undefined;
    }

    /**
     * O(1)
     */
    popFront(): ModOrderItem | undefined {
        const obj = this.order.shift();
        if (obj) {
            const m = this.container.get(obj.name);
            if (m) {
                m.delete(obj.from);
                if (m.size === 0) {
                    this.container.delete(obj.name);
                }
                this.checkData();
                return obj;
            }
        }
        return undefined;
    }

    /**
     * O(1)
     */
    clear(): void {
        this.container.clear();
        this.order = [];
    }

    /**
     * O(1)
     */
    get size(): number {
        return this.order.length;
    }

    /**
     * O(2n)
     */
    clone(): ModOrderContainer {
        const r = new ModOrderContainer();
        r.container = new Map<string, Map<ModLoadFromSourceType, ModOrderItem>>();
        for (const [name, m] of this.container) {
            const mm = new Map<ModLoadFromSourceType, ModOrderItem>();
            for (const [from, item] of m) {
                mm.set(from, r.createModOrderItem(item.zip, item.from)!);
            }
            r.container.set(name, mm);
        }
        r.order = [];
        for (const item of this.order) {
            r.order.push(r.createModOrderItem(item.zip, item.from)!);
        }
        r.checkData();
        return r;
    }

    /**
     * O(n)
     */
    private rebuildContainerFromOrder(): void {
        this.container.clear();
        for (const item of this.order) {
            if (!this.container.has(item.name)) {
                this.container.set(item.name, new Map<ModLoadFromSourceType, ModOrderItem>());
            }
            const m = this.container.get(item.name);
            if (m) {
                m.set(item.from, item);
            }
        }
        this.checkData();
    }

    /**
     * O(2n)
     */
    splitCloneInArray(name: string, from: ModLoadFromSourceType): {
        before: ModOrderContainer,
        current: ModOrderItem,
        after: ModOrderContainer,
    } | undefined {
        // split to 3 piece
        const index = this.order.findIndex(T => T.name === name && T.from === from);
        if (index === -1) {
            return undefined;
        }
        const r = {
            before: new ModOrderContainer(),
            current: this.order.slice(index, index + 1)[0],
            after: new ModOrderContainer(),
        };
        r.before.order = this.order.slice(0, index);
        r.after.order = this.order.slice(index + 1);
        r.before.rebuildContainerFromOrder();
        r.after.rebuildContainerFromOrder();
        return r;
    }

    static mergeModOrderContainer(nnn: (ModOrderContainer | ModOrderItem)[]): ModOrderContainer {
        const r = new ModOrderContainer();
        r.order = [];
        for (const n of nnn) {
            if (isModOrderContainer(n)) {
                r.order = r.order.concat(n.order);
            } else if (isModOrderItem(n)) {
                r.order.push(n);
            } else {
                // never go there
                console.error('ModOrderContainer mergeModOrderContainer() unknown type.', [n]);
                throw new Error('ModOrderContainer mergeModOrderContainer() unknown type.');
            }
        }
        r.rebuildContainerFromOrder();
        return r;
    }

}
