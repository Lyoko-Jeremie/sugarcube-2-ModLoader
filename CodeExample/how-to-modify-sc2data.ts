import type {} from '../src/BeforeSC2/global';
import type {SC2DataManager} from '../dist-BeforeSC2/SC2DataManager';
import type {ModUtils} from '../dist-BeforeSC2/Utils';
import type {SC2DataInfoCache, PassageDataItem} from "../dist-BeforeSC2/SC2DataInfoCache";
import type {SC2DataInfo} from "../dist-BeforeSC2/SC2DataInfoCache";

const gUtils: ModUtils = window.modUtils;
const gSC2DataManager: SC2DataManager = window.modSC2DataManager;

const scOld: SC2DataInfoCache = gSC2DataManager.getSC2DataInfoAfterPatch();
// make a new copy of sc2data, keep the old one.
// notice: never touch the `scOld`, the `gUtils.replaceFollowSC2DataInfo` need the `scOld` to speed up replace
const sc: SC2DataInfo = scOld.cloneSC2DataInfo();

{
    // do something...

    // get the passage by name
    const pp: PassageDataItem | undefined = sc.passageDataItems.map.get('PassageName');
    // the passage name:
    console.log(`passageName:[${pp.name}]`);

    // change the passage code
    // note that , the code not include the passage name `:: PassageName` line
    pp.content.replace('aaaa', 'bbbb');

    // similar like the passage, you can modify the js code
    sc.scriptFileItems.map.get('scriptName.js')?.content.replace('aaaa', 'bbbb');
}

// if you modify the `passageDataItems.map`, you need call this to update the `passageDataItems.items`
// because the `gUtils.replaceFollowSC2DataInfo` use the `passageDataItems.items` to update the html
sc.passageDataItems.back2Array();
// save all modify
gUtils.replaceFollowSC2DataInfo(sc, scOld);

