import {get as keyval_get, set as keyval_set, del as keyval_del, createStore, UseStore, setMany} from 'idb-keyval';

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
