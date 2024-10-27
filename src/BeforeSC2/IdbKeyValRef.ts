import {get as keyval_get, set as keyval_set, del as keyval_del, createStore, UseStore, setMany} from 'idb-keyval';
import {openDB as idb_openDB, deleteDB as idb_deleteDB} from 'idb';

export class IdbRef {
    get idb_openDB(): typeof idb_openDB {
        return idb_openDB;
    }

    get idb_deleteDB(): typeof idb_deleteDB {
        return idb_deleteDB;
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

    get createStore() {
        return createStore;
    }

    get setMany() {
        return setMany;
    }
}
