import {SC2DataInfoCache} from "SC2DataInfoCache";

export function replaceMergeSC2DataInfoCache(...ic: SC2DataInfoCache[]) {
    if (ic.length === 0) {
        throw new Error('replaceMergeSC2DataInfoCache (ic.length === 0)');
    }
    const ooo = ic[0];
    for (let i = 1; i < ic.length; i++) {
        ooo.styleFileItems.replaceMerge(ic[i].styleFileItems);
        ooo.scriptFileItems.replaceMerge(ic[i].scriptFileItems);
        ooo.passageDataItems.replaceMerge(ic[i].passageDataItems);
    }
    return ooo;
}

export function concatMergeSC2DataInfoCache(...ic: SC2DataInfoCache[]) {
    if (ic.length === 0) {
        throw new Error('concatMergeSC2DataInfoCache (ic.length === 0)');
    }
    const ooo = ic[0];
    for (let i = 1; i < ic.length; i++) {
        ooo.styleFileItems.concatMerge(ic[i].styleFileItems);
        ooo.scriptFileItems.concatMerge(ic[i].scriptFileItems);
        ooo.passageDataItems.concatMerge(ic[i].passageDataItems);
    }
    return ooo;
}
