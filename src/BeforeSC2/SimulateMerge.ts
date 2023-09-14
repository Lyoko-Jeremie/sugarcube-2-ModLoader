import {SC2DataInfo, SC2DataInfoCache} from "./SC2DataInfoCache";
import {cloneDeep} from "lodash";

export interface SimulateMergeResultItem {
    ok: Set<string>;
    conflict: Set<string>;
}

export interface SimulateMergeResult {
    styleFileItems: SimulateMergeResultItem;
    scriptFileItems: SimulateMergeResultItem;
    passageDataItems: SimulateMergeResultItem;
    dataSource: string;
}

// input ok set, output ok(new) set and conflict(overflow) set
// the a set will be modified(update)
export function simulateMergeStep(a: Set<string>, b: Set<string>): SimulateMergeResultItem {
    const r: SimulateMergeResultItem = {
        ok: a,
        conflict: new Set<string>(),
    };

    for (const item of b) {
        if (r.ok.has(item)) {
            r.conflict.add(item);
        } else {
            r.ok.add(item);
        }
    }

    return r;
}

export function simulateMergeSC2DataInfoCache(...ic: SC2DataInfo[]): SimulateMergeResult[] {
    if (ic.length === 0) {
        throw new Error('simulateMergeSC2DataInfoCache (ic.length === 0)');
    }
    const ooo = ic[0];
    const createResult = (c: SC2DataInfo): SimulateMergeResult => {
        return {
            styleFileItems: {
                ok: new Set<string>(c.styleFileItems.map.keys()),
                conflict: new Set<string>(),
            },
            scriptFileItems: {
                ok: new Set<string>(c.scriptFileItems.map.keys()),
                conflict: new Set<string>(),
            },
            passageDataItems: {
                ok: new Set<string>(c.passageDataItems.map.keys()),
                conflict: new Set<string>(),
            },
            dataSource: c.dataSource,
        }
    };
    const temp: Omit<SimulateMergeResult, 'dataSource'> = createResult(ooo);
    const r: SimulateMergeResult[] = [];
    for (let i = 1; i < ic.length; i++) {
        const c = ic[i];
        const t = createResult(c);
        t.styleFileItems = simulateMergeStep(temp.styleFileItems.ok, t.styleFileItems.ok);
        t.scriptFileItems = simulateMergeStep(temp.scriptFileItems.ok, t.scriptFileItems.ok);
        t.passageDataItems = simulateMergeStep(temp.passageDataItems.ok, t.passageDataItems.ok);
        r.push(cloneDeep(t));
    }
    return r;
}
