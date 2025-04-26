import {LogWrapper} from "ModLoadController";
import {cloneDeep, parseInt} from "lodash";

export interface StyleTextFileItem {
    // 0 means no id
    id: number;
    name: string;
    content: string;
}

export interface ScriptTextFileItem {
    // 0 means no id
    id: number;
    name: string;
    content: string;
}

export interface PassageDataItem {
    // 0 means no id
    id: number;
    name: string;
    tags: string[];
    content: string;
    // dont care
    position?: string;
    // dont care
    size?: string;
}

export class CacheRecord<T extends { name: string, content: string }> {
    constructor(
        public log: LogWrapper,
        public dataSource: string,
        public cacheRecordName: string,
        public needBuildNoPathCache: boolean = false,
    ) {
    }

    getNoPathNameFromString(s: string) {
        // get file name `error.js` from `game\\00-framework-tools\\01-error\\error.js` like string
        const path = s.split(/(\\|\/)/g);
        if (path.length < 2) {
            return s;
        }
        return path[path.length - 1];
    }

    noPathCache?: Map<string, string[]> = new Map<string, string[]>();

    buildNoPathCache() {
        if (!this.needBuildNoPathCache) {
            this.noPathCache = undefined;
            return;
        }
        this.noPathCache = new Map<string, string[]>();
        for (const k of this.map.keys()) {
            const kk = this.getNoPathNameFromString(k);
            if (!this.noPathCache.has(kk)) {
                this.noPathCache.set(kk, [k]);
            } else {
                this.noPathCache.get(kk)!.push(k);
            }
        }
        // check noPathCache no duplicate
        for (const [k, v] of this.noPathCache) {
            if (v.length > 1) {
                console.warn('CacheRecord.buildNoPathCache() has duplicate name:', k, v);
                this.log.warn(`CacheRecord.buildNoPathCache() has duplicate name: [${k}] [${v.join('], [')}]`);
            }
        }
    }

    clean() {
        this.items = [];
        this.map.clear();
        this.noName = [];
        this.dataSource = '';
        this.cacheRecordName = '';
        this.buildNoPathCache();
    }

    items: T[] = [];

    fillMap() {
        this.map.clear();
        this.noName = [];
        for (const item of this.items) {
            if (item.name) {
                if (this.map.has(item.name)) {
                    console.warn('CacheRecord.fillMap() has duplicate name:',
                        [item.name],
                        [this.cacheRecordName, this.dataSource],
                    );
                    this.log.warn(`CacheRecord.fillMap() has duplicate name: [${item.name}] [${this.cacheRecordName} ${this.dataSource}]`);
                }
                this.map.set(item.name, item);
            } else {
                this.noName.push(item);
            }
        }
        this.buildNoPathCache();
    }

    back2Array() {
        this.items = Array.from(this.map.values()).concat(this.noName);
    }

    map: Map<string, T> = new Map<string, T>();
    noName: T[] = [];

    replaceMerge(c: CacheRecord<T>, noWarnning: boolean = false) {
        // console.log('CacheRecord.replaceMerge() start this.items', this.items.length);
        // console.log('CacheRecord.replaceMerge() start this.map.size', this.map.size);
        for (const item of c.items) {
            if (this.map.has(item.name)) {
                if (!noWarnning) {
                    console.warn('CacheRecord.replaceMerge() has duplicate name:',
                        [this.cacheRecordName, this.dataSource],
                        [c.cacheRecordName, c.dataSource],
                        this.map,
                        c.items,
                        [item.name, item.content],
                    );
                    this.log.warn(`CacheRecord.replaceMerge() has duplicate name: ` +
                        `[${this.cacheRecordName} ${this.dataSource}] [${c.cacheRecordName} ${c.dataSource}] ${item.name}`);
                }
            }
            this.map.set(item.name, item);
        }
        this.noName = this.noName.concat(c.noName);
        this.items = Array.from(this.map.values()).concat(this.noName);
        // console.log('CacheRecord.replaceMerge() end this.items', this.items.length);
        // console.log('CacheRecord.replaceMerge() end this.map.size', this.map.size);
        this.buildNoPathCache();
    }

    concatMerge(c: CacheRecord<T>) {
        for (const item of c.items) {
            if (this.map.has(item.name)) {
                const n = this.map.get(item.name)!;
                n.content = n.content + '\n' + item.content;
            } else {
                this.map.set(item.name, item);
            }
        }
        this.noName = this.noName.concat(c.noName);
        this.items = Array.from(this.map.values()).concat(this.noName);
        this.buildNoPathCache();
    }

    public getByNameWithNoPath(s: string): T | undefined {
        const orgS = this.noPathCache?.get(s) ?? [s];
        return this.map.get(orgS[0]);
    }

}

export class SC2DataInfo {
    styleFileItems: CacheRecord<StyleTextFileItem>; // = new CacheRecord<StyleTextFileItem>(this.log, this.dataSource, 'styleFileItems');
    scriptFileItems: CacheRecord<ScriptTextFileItem>; // = new CacheRecord<ScriptTextFileItem>(this.log, this.dataSource, 'scriptFileItems');
    passageDataItems: CacheRecord<PassageDataItem>; // = new CacheRecord<PassageDataItem>(this.log, this.dataSource, 'passageDataItems');

    constructor(
        public log: LogWrapper,
        // 'orgin' OR modName
        public dataSource: string,
    ) {
        // init on there for fix babel https://github.com/babel/babel/issues/13779
        this.styleFileItems = new CacheRecord<StyleTextFileItem>(this.log, this.dataSource, 'styleFileItems');
        this.scriptFileItems = new CacheRecord<ScriptTextFileItem>(this.log, this.dataSource, 'scriptFileItems');
        this.passageDataItems = new CacheRecord<PassageDataItem>(this.log, this.dataSource, 'passageDataItems');
    }

    clean() {
        this.scriptFileItems.clean();
    }
}

export class SC2DataInfoCache extends SC2DataInfo {

    cloneSC2DataInfo() {
        const r = new SC2DataInfo(
            this.log,
            this.dataSource,
        );
        r.styleFileItems = cloneDeep(this.styleFileItems);
        r.scriptFileItems = cloneDeep(this.scriptFileItems);
        r.passageDataItems = cloneDeep(this.passageDataItems);
        return r;
    }

    constructor(
        public log: LogWrapper,
        public dataSource: string,
        public scriptNode: HTMLScriptElement[],
        public styleNode: HTMLStyleElement[],
        public passageDataNodes: HTMLElement[],
    ) {
        super(log, dataSource);

        for (const sn of styleNode) {
            // /* twine-user-stylesheet #1: "error.css" */
            const syl = sn.innerText.split(/(\/\* twine-user-stylesheet #)(\d+): "([^'"]+)" \*\//);
            // will get : ["xxxxx", "/* twine-user-stylesheet #", "1", "error.css", "xxxxx"]
            for (let i = 0; i < syl.length;) {
                if (syl[i] === "/* twine-user-stylesheet #") {
                    this.styleFileItems.items.push({
                        id: parseInt(syl[++i]), // i+1
                        name: syl[++i], // i+2
                        content: syl[++i],  // i+3
                    });
                }
                ++i;
            }
        }
        this.styleFileItems.fillMap();

        for (const sn of scriptNode) {
            // /* twine-user-script #1: "namespace.js" */
            const scl = sn.innerText.split(/(\/\* twine-user-script #)(\d+): "([^'"]+)" \*\//);
            // will get : ["xxxxx", "/* twine-user-script #", "1", "namespace.js", "xxxxx"]
            for (let i = 0; i < scl.length;) {
                if (scl[i] === "/* twine-user-script #") {
                    this.scriptFileItems.items.push({
                        id: parseInt(scl[++i]), // i+1
                        name: scl[++i], // i+2
                        content: scl[++i],  // i+3
                    });
                }
                ++i;
            }
            // console.log('this.scriptFileItems.items sn.innerText', scl, [sn.innerText], this.scriptFileItems.items.length)
        }
        // console.log('this.scriptFileItems.items', this.scriptFileItems.items.length);
        this.scriptFileItems.fillMap();

        for (const passageDataNode of passageDataNodes) {
            // <tw-passagedata pid="1" name="Upgrade Waiting Room" tags="widget" position="100,100" size="100,100">xxxxx</tw-passagedata>
            this.passageDataItems.items.push({
                id: parseInt(passageDataNode.getAttribute('pid') || '0'),
                name: passageDataNode.getAttribute('name') || '',
                tags: passageDataNode.getAttribute('tags')?.split(' ') || [],
                content: passageDataNode.innerText || '',
                position: passageDataNode.getAttribute('position') || '',
                size: passageDataNode.getAttribute('size') || '',
            });
        }
        this.passageDataItems.fillMap();

    }


}
