import {isString, isArray, every, isNil, get} from 'lodash';
import {SC2DataInfo} from "./SC2DataInfoCache";

export interface PatchInfo {
    js?: PatchInfoItem[];
    css?: PatchInfoItem[];
    twee?: PatchInfoItem[];
}

export interface PatchInfoItem {
    from: string;
    to: string;
    fileName: string;
    passageName?: string;
}

function checkPatchInfoItem(o: any): o is PatchInfoItem {
    return o
        && isString(o.from)
        && isString(o.to)
        && isString(o.fileName)
        ;
}

function checkPatchInfoItemPassage(o: any): o is PatchInfoItem {
    return o
        && isString(o.from)
        && isString(o.to)
        // && isString(o.fileName)
        && isString(o.passageName)
        ;
}

export function checkPatchInfo(o: any): o is PatchInfo {
    return o
        && (o.js ? (isArray(o.js) && every(o.js, checkPatchInfoItem)) : true)
        && (o.css ? (isArray(o.css) && every(o.css, checkPatchInfoItem)) : true)
        && (o.twee ? (isArray(o.twee) && every(o.twee, checkPatchInfoItemPassage)) : true)
        ;
}

function ModI18NTypeB_escapedPatternString(pattern: string): string {
    return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceAndRecordPositions(s: string, from: string, to: string) {
    let positions: number[] = [];

    let r = s.replace(from, (match, offset) => {
        positions.push(offset);
        return to;
    });

    return {
        r: r,
        positions: positions
    };
}

function tryReplaceStringFuzzyWithHint(s: string, v: {
    from: string,
    to: string,
    pos: number
}, passageNameOrFileName: string) {
    // first , we try to match and replace with const string in +-2 , this is the fastest way
    if (s.substring(v.pos, v.pos + v.from.length) === v.from) {
        s = s.substring(0, v.pos) + v.to + s.substring(v.pos + v.from.length);
    } else if (s.substring(v.pos - 1, v.pos + v.from.length - 1) === v.from) {
        s = s.substring(0, v.pos - 1) + v.to + s.substring(v.pos - 1 + v.from.length);
    } else if (s.substring(v.pos - 2, v.pos + v.from.length - 2) === v.from) {
        s = s.substring(0, v.pos - 2) + v.to + s.substring(v.pos - 2 + v.from.length);
    } else if (s.substring(v.pos + 1, v.pos + v.from.length + 1) === v.from) {
        s = s.substring(0, v.pos + 1) + v.to + s.substring(v.pos + 1 + v.from.length);
    } else if (s.substring(v.pos + 2, v.pos + v.from.length + 2) === v.from) {
        s = s.substring(0, v.pos + 2) + v.to + s.substring(v.pos + 2 + v.from.length);
    } else {
        // otherwise , we try to match and replace with fuzzy match in [-10~+30]
        try {
            let re: RegExp | undefined = new RegExp(ModI18NTypeB_escapedPatternString(v.from), '');
            // re.lastIndex = v.pos;
            const startPos = Math.max(0, v.pos - 10);
            const endPos = Math.min(s.length, v.pos + v.from.length + 30);
            const mm = re.exec(s.substring(startPos, endPos));
            if (mm) {
                const pStart = startPos + mm.index;
                const pEnd = pStart + v.from.length;
                s = s.substring(0, pStart) + v.to + s.substring(pEnd);
            } else {
                console.error('tryReplaceStringFuzzyWithHint cannot find: ',
                    [v.from], ' in ', [passageNameOrFileName], ' at ', [v.pos], ' in ', [s.substring(v.pos - 10, v.pos + v.from.length + 10)]);
            }
            re = undefined;
        } catch (e) {
            console.error(e);
            console.error('tryReplaceStringFuzzyWithHint cannot find with error: ',
                [v.from], ' in ', [passageNameOrFileName], ' at ', [v.pos], ' in ', [s.substring(v.pos - 10, v.pos + v.from.length + 10)]);
        }
    }
    return s;
}

interface PatchInfoMap {
    js: Map<string, PatchInfoItem[]>;
    css: Map<string, PatchInfoItem[]>;
    twee: Map<string, PatchInfoItem[]>;
}

export class ReplacePatcher {
    public patchInfo: PatchInfo;
    public patchInfoMap: PatchInfoMap;

    constructor(
        public modName: string,
        public patchInfo_: any,
    ) {
        if (!checkPatchInfo(patchInfo_)) {
            console.error('ReplacePatcher() invalid patchInfo', [modName, patchInfo_]);
            this.patchInfo = {};
        } else {
            this.patchInfo = patchInfo_;
        }
        this.patchInfoMap = {
            js: this.patchInfo.js ? new Map(this.patchInfo.js.map((T) => [T.fileName, T])) : new Map(),
            css: this.patchInfo.css ? new Map(this.patchInfo.css.map((T) => [T.fileName, T])) : new Map(),
            twee: this.patchInfo.twee ? new Map(this.patchInfo.twee.map((T) => [T.passageName, T])) : new Map(),
        };
    }

    applyReplacePatcher(modSC2DataInfoCache: SC2DataInfo) {
        for (const item of modSC2DataInfoCache.scriptFileItems.items) {
            const patchInfoItems = this.patchInfoMap.js.get(item.name);
            if (!patchInfoItems) {
                continue;
            }
            let s = item.content;
            for (const patchInfoItem of patchInfoItems) {
                // s = s.replace(patchInfoItem.from, patchInfoItem.to);
                const r = replaceAndRecordPositions(s, patchInfoItem.from, patchInfoItem.to);
                s = r.r;
                if (r.positions.length > 1) {
                    console.warn('applyReplacePatcher() js replace multiple: ',
                        ' in ',
                        [item.name],
                        ' of ',
                        [patchInfoItem.from],
                        ' to ',
                        [patchInfoItem.to],
                        ' positions ',
                        [r.positions],
                        ' content ',
                        [item.content],
                    );
                }
            }
            item.content = s;
        }
        for (const item of modSC2DataInfoCache.styleFileItems.items) {
            const patchInfoItems = this.patchInfoMap.css.get(item.name);
            if (!patchInfoItems) {
                continue;
            }
            let s = item.content;
            for (const patchInfoItem of patchInfoItems) {
                // s = s.replace(patchInfoItem.from, patchInfoItem.to);
                const r = replaceAndRecordPositions(s, patchInfoItem.from, patchInfoItem.to);
                s = r.r;
                if (r.positions.length > 1) {
                    console.warn('applyReplacePatcher() css replace multiple: ',
                        ' in ',
                        [item.name],
                        ' of ',
                        [patchInfoItem.from],
                        ' to ',
                        [patchInfoItem.to],
                        ' positions ',
                        [r.positions],
                        ' content ',
                        [item.content],
                    );
                }
            }
            item.content = s;
        }
        for (const item of modSC2DataInfoCache.passageDataItems.items) {
            const patchInfoItems = this.patchInfoMap.twee.get(item.name);
            if (!patchInfoItems) {
                continue;
            }
            let s = item.content;
            for (const patchInfoItem of patchInfoItems) {
                // s = s.replace(patchInfoItem.from, patchInfoItem.to);
                const r = replaceAndRecordPositions(s, patchInfoItem.from, patchInfoItem.to);
                s = r.r;
                if (r.positions.length > 1) {
                    console.warn('applyReplacePatcher() passage replace multiple: ',
                        ' in ',
                        [item.name],
                        ' of ',
                        [patchInfoItem.from],
                        ' to ',
                        [patchInfoItem.to],
                        ' positions ',
                        [r.positions],
                        ' content ',
                        [item.content],
                    );
                }
            }
            item.content = s;
        }
    }

}
