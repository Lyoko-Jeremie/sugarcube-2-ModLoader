import {parseInt} from "lodash";

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
        public dataSource: string,
        public cacheRecordName: string,
    ) {
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
                }
                this.map.set(item.name, item);
            } else {
                this.noName.push(item);
            }
        }
    }

    map: Map<string, T> = new Map<string, T>();
    noName: T[] = [];

    replaceMerge(c: CacheRecord<T>, noWarnning: boolean = false) {
        // console.log('CacheRecord.replaceMerge() this.items', this.items.length);
        // console.log('CacheRecord.replaceMerge() this.map.size', this.map.size);
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
                }
            }
            this.map.set(item.name, item);
        }
        this.noName = this.noName.concat(c.noName);
        this.items = Array.from(this.map.values()).concat(this.noName);
        // console.log('CacheRecord.replaceMerge() this.items', this.items.length);
        // console.log('CacheRecord.replaceMerge() this.map.size', this.map.size);
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
    }

}

export class SC2DataInfo {
    styleFileItems: CacheRecord<StyleTextFileItem> = new CacheRecord<StyleTextFileItem>(this.dataSource, 'styleFileItems');
    scriptFileItems: CacheRecord<ScriptTextFileItem> = new CacheRecord<ScriptTextFileItem>(this.dataSource, 'scriptFileItems');
    passageDataItems: CacheRecord<PassageDataItem> = new CacheRecord<PassageDataItem>(this.dataSource, 'passageDataItems');

    constructor(
        // 'orgin' OR modName
        public dataSource: string,
    ) {
    }
}

export class SC2DataInfoCache extends SC2DataInfo {

    cloneSC2DataInfo() {
        const r = new SC2DataInfo(
            this.dataSource,
        );
        r.styleFileItems = structuredClone(this.styleFileItems);
        r.scriptFileItems = structuredClone(this.scriptFileItems);
        r.passageDataItems = structuredClone(this.passageDataItems);
        return r;
    }

    constructor(
        public dataSource: string,
        public scriptNode: HTMLScriptElement[],
        public styleNode: HTMLStyleElement[],
        public passageDataNodes: HTMLElement[],
    ) {
        super(dataSource);

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
        }
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
