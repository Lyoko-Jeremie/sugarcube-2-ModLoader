import {
    get as keyval_get,
    set as keyval_set,
    del as keyval_del,
    createStore,
    UseStore,
    setMany,
    clear, keys, values, entries,
} from 'idb-keyval';
import {openDB as idb_openDB, deleteDB as idb_deleteDB} from 'idb';
import * as idbInstance from 'idb';

export class IdbRef {
    get idb_openDB(): typeof idb_openDB {
        return idb_openDB;
    }

    get idb_deleteDB(): typeof idb_deleteDB {
        return idb_deleteDB;
    }

    get idbInstance() {
        return idbInstance;
    }

}

export class IdbKeyValRef {
    get keyval_get() {
        return keyval_get;
    }

    get keyval_set() {
        return keyval_set;
    }

    get keyval_del() {
        return keyval_del;
    }

    get get() {
        return keyval_get;
    }

    get set() {
        return keyval_set;
    }

    get del() {
        return keyval_del;
    }

    get createStore() {
        return createStore;
    }

    get setMany() {
        return setMany;
    }

    get clear() {
        return clear;
    }

    get keys() {
        return keys;
    }

    get values() {
        return values;
    }

    get entries() {
        return entries;
    }
}
