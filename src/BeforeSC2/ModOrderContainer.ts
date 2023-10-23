import {ModZipReader} from "./ModZipReader";
import {ModInfo} from "./ModLoader";
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
} from 'lodash';

export const ModLoadFromSourceList = [
    'Remote',
    'Local',
    'LocalStorage',
    'IndexDB',
    'SideLazy',
] as const;

export type ModLoadFromSourceType = typeof ModLoadFromSourceList[number];

export interface ModOrderItem {
    name: string;
    from: ModLoadFromSourceType;
    mod: ModInfo;
    zip: ModZipReader;
}

class CustomIterableIterator<T, Parent> implements IterableIterator<T> {
    index = 0;

    constructor(
        public parent: Parent,
        public nextF: (index: number, p: Parent, ito: CustomIterableIterator<T, Parent>) => IteratorResult<T>,
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

export class ModOrderContainer_One_ReadonlyMap implements ReadonlyMap<string, ModOrderItem> {
    constructor(
        public parent: ModOrderContainer,
    ) {
        parent.checkNameUniq();
    }

    get size() {
        return this.parent.container.size;
    };

    [Symbol.iterator](): IterableIterator<[string, ModOrderItem]> {
        return this.entries();
    }

    entries(): IterableIterator<[string, ModOrderItem]> {
        return new CustomIterableIterator<[string, ModOrderItem], ModOrderContainer>(
            this.parent,
            (index, p, ito) => {
                if (index >= p.container.size) {
                    return {done: true, value: undefined};
                } else {
                    const it = Array.from(p.container.keys())[index];
                    const itt = this.get(it);
                    // console.log('entries()', index, it, itt);
                    if (!it || !itt) {
                        console.error('entries() (!it || !itt)', index, it, itt);
                        throw new Error('entries() (!it || !itt)');
                    }
                    return {done: false, value: [it, itt]};
                }
            }
        );
    }

    forEach(callback: (value: ModOrderItem, key: string, map: ReadonlyMap<string, ModOrderItem>) => void, thisArg?: any): void {
    }

    get(key: string): ModOrderItem | undefined {
        return this.parent.container.get(key)?.values().next().value;
    }

    has(key: string): boolean {
        return this.parent.container.has(key) && this.parent.container.get(key)!.size > 0;
    }

    keys(): IterableIterator<string> {
        return new CustomIterableIterator<string, ModOrderContainer>(
            this.parent,
            (index, p, ito) => {
                const name = Array.from(p.container.keys())[index];
                return {
                    done: index >= p.container.size,
                    value: name,
                };
            },
        );
    }

    values(): IterableIterator<ModOrderItem> {
        return new CustomIterableIterator<ModOrderItem, ModOrderContainer>(
            this.parent,
            (index, p, ito) => {
                const name = Array.from(p.container.keys())[index];
                return {
                    done: index >= p.container.size,
                    value: p.container.get(name)!.values().next().value,
                };
            },
        );
    }

}


export class ModOrderContainer {
    container: Map<string, Map<ModLoadFromSourceType, ModOrderItem>> = new Map<string, Map<ModLoadFromSourceType, ModOrderItem>>();
    order: ModOrderItem[] = [];

    constructor() {
    }

    /**
     * O(1)
     */
    get_One_Map() {
        return new ModOrderContainer_One_ReadonlyMap(this);
    }

    /**
     * O(2n)
     */
    get_One_Array() {
        this.checkNameUniq();
        return uniqBy(this.order, T => T.name);
    }

    /**
     * O(n)
     */
    get_Array() {
        return clone(this.order);
    }

    /**
     * O(1)
     */
    getHasByName(name: string) {
        return this.container.has(name) && this.container.get(name)!.size > 0;
    }

    /**
     * O(1)
     */
    getHasByNameFrom(name: string, from: ModLoadFromSourceType) {
        return this.container.has(name) && this.container.get(name)!.has(from);
    }

    /**
     * O(1)
     */
    getByName(name: string) {
        return this.container.get(name);
    }

    /**
     * O(1)
     */
    getByNameOne(name: string) {
        const nn = this.container.get(name);
        if (!nn) {
            console.error('ModOrderContainer getByNameOne() cannot find name.', [name, this.container]);
            return undefined;
        }
        if (nn.size > 1) {
            console.error('ModOrderContainer getByNameOne() has more than one mod.', [name, nn]);
            return undefined;
        }
        return nn.values().next().value;
    }

    /**
     * O(n)
     */
    getByOrder(name: string) {
        return this.order.filter(T => T.name === name);
    }

    /**
     * O(n)
     */
    checkNameUniq() {
        for (const [name, m] of this.container) {
            if (m.size > 1) {
                console.error('ModOrderContainer checkNameUniq() name not uniq.', [name, m]);
                return false;
            }
        }
        return true;
    }

    /**
     * O(n+log(n)*2)
     */
    checkData() {
        // covert container to order , sort it, then compare order one-by-one to check container==order
        const order: ModOrderItem[] = [];
        for (const [name, m] of this.container) {
            for (const [from, item] of m) {
                order.push(item);
            }
        }
        const order1 = orderBy(order, ['name', 'from'], ['asc', 'asc']);
        const order2 = orderBy(this.order, ['name', 'from'], ['asc', 'asc']);
        if (!isEqualWith(order1, order2, (a, b) => a.name === b.name && a.from === b.from)) {
            console.error('ModOrderContainer checkData() failed.', [order1, order2]);
            return false;
        }
        return true;
    }

    /**
     * O(1)
     */
    delete(name: string, from: ModLoadFromSourceType) {
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
     * O(1)
     */
    deleteAll(name: string) {
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
    createModOrderItem(zip: ModZipReader, from: ModLoadFromSourceType) {
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
    pushFront(zip: ModZipReader, from: ModLoadFromSourceType) {
        const obj = this.createModOrderItem(zip, from);
        if (!obj) {
            console.error('ModOrderContainer pushFront() createModOrderItem() failed.', [zip, from]);
            return false;
        }
        const m = this.container.get(obj.name);
        if (m) {
            m.set(obj.from, obj);
            this.order.splice(this.order.findIndex(T => T.name === obj.name && T.from === obj.from), 1);
            this.order = [obj, ...this.order];
            this.checkData();
            return true;
        }
        return false;
    }

    /**
     * O(2n)
     */
    pushBack(zip: ModZipReader, from: ModLoadFromSourceType) {
        const obj = this.createModOrderItem(zip, from);
        if (!obj) {
            console.error('ModOrderContainer pushBack() createModOrderItem() failed.', [zip, from]);
            return false;
        }
        if (!this.container.has(obj.name)) {
            this.container.set(obj.name, new Map<ModLoadFromSourceType, ModOrderItem>());
        }
        const m = this.container.get(obj.name);
        if (m) {
            m.set(obj.from, obj);
            this.order.splice(this.order.findIndex(T => T.name === obj.name && T.from === obj.from), 1);
            this.order.push(obj);
            this.checkData();
            return true;
        }
        return false;
    }

    /**
     * O(2n)
     */
    insertReplace(zip: ModZipReader, from: ModLoadFromSourceType) {
        const obj = this.createModOrderItem(zip, from);
        if (!obj) {
            console.error('ModOrderContainer insertReplace() createModOrderItem() failed.', [zip, from]);
            return false;
        }
        if (!this.container.has(obj.name)) {
            this.container.set(obj.name, new Map<ModLoadFromSourceType, ModOrderItem>());
        }
        const m = this.container.get(obj.name);
        if (m) {
            m.set(obj.from, obj);
            this.order.splice(this.order.findIndex(T => T.name === obj.name && T.from === obj.from), 0, obj);
            this.checkData();
            return true;
        }
        return false;
    }

}
