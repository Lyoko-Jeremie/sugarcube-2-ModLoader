import {SC2DataInfo} from "./SC2DataInfoCache";

export function replaceMergeSC2DataInfoCache(...ic: SC2DataInfo[]) {
    if (ic.length === 0) {
        throw new Error('replaceMergeSC2DataInfoCache (ic.length === 0)');
    }
    const ooo = ic[0];
    // console.log('replaceMergeSC2DataInfoCache', ooo.passageDataItems.items.length);
    for (let i = 1; i < ic.length; i++) {
        // console.log('replaceMergeSC2DataInfoCache', ooo, ic[i]);
        ooo.scriptFileItems.replaceMerge(ic[i].scriptFileItems);
        ooo.styleFileItems.replaceMerge(ic[i].styleFileItems);
        ooo.passageDataItems.replaceMerge(ic[i].passageDataItems);
    }
    // console.log('replaceMergeSC2DataInfoCache', ooo.passageDataItems.items.length);
    return ooo;
}

export function concatMergeSC2DataInfoCache(...ic: SC2DataInfo[]) {
    if (ic.length === 0) {
        throw new Error('concatMergeSC2DataInfoCache (ic.length === 0)');
    }
    const ooo = ic[0];
    for (let i = 1; i < ic.length; i++) {
        ooo.scriptFileItems.concatMerge(ic[i].scriptFileItems);
        ooo.styleFileItems.concatMerge(ic[i].styleFileItems);
        ooo.passageDataItems.concatMerge(ic[i].passageDataItems);
    }
    return ooo;
}

export function normalMergeSC2DataInfoCache(...ic: SC2DataInfo[]) {
    if (ic.length === 0) {
        throw new Error('concatMergeSC2DataInfoCache (ic.length === 0)');
    }
    const ooo = ic[0];
    for (let i = 1; i < ic.length; i++) {
        ooo.scriptFileItems.concatMerge(ic[i].scriptFileItems);
        ooo.styleFileItems.concatMerge(ic[i].styleFileItems);
        ooo.passageDataItems.replaceMerge(ic[i].passageDataItems);
    }
    return ooo;
}
