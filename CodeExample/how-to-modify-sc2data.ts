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

    // similar like above, you can modify the js code
    // use the `getByNameWithNoPath()` to skip js file issue
    sc.scriptFileItems.getByNameWithNoPath('scriptName.js')?.content.replace('aaaa', 'bbbb');

    {
        // add new passage
        // the passage name must not exist, otherwise you will overwrite it
        sc.passageDataItems.map.set('NewPassageName', {
            name: 'NewPassageName',     // the passage name, must same as the key of `map`
            id: 0,      // set it `0` if a new passage
            tags: [],   // set it to `[ 'widget' ]` if is a widget passage, otherwise, set it to `[]`
            content: 'NewPassageName content',
        });
    }
}

// if you modify the `passageDataItems.map`, you need call this to update the `passageDataItems.items`
// because the `gUtils.replaceFollowSC2DataInfo` use the `passageDataItems.items` to update the html
sc.passageDataItems.back2Array();
// save all modify
gUtils.replaceFollowSC2DataInfo(sc, scOld);

// you can call `clean()` to release memory reference, it is not required
sc.clean();
scOld.clean();
