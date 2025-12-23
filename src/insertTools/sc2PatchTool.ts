import * as cheerio from 'cheerio';
import process from 'process';
import fs from 'fs';
import {} from 'path';
import {promisify} from 'util';
import {has} from 'lodash';

;(async () => {
    console.log('process.argv.length', process.argv.length);
    console.log('process.argv', process.argv);
    const htmlPath = process.argv[2];
    const i10nPath = process.argv[3];
    console.log('htmlPath', htmlPath);
    console.log('i10nPath', i10nPath);
    if (!htmlPath) {
        console.error('no htmlPath');
        process.exit(-1);
        return;
    }
    const htmlF = await promisify(fs.readFile)(htmlPath, {encoding: 'utf-8'});
    let i10nF;
    let i10nNode;
    if (i10nPath) {
        i10nF = await promisify(fs.readFile)(i10nPath, {encoding: 'utf-8'});
        i10nNode = `
<script id="i10n-sc2patch" type="text/javascript">
    window.initI10n = (l10nStrings)=>{
        ${i10nF}
    };
</script>
        `;
    } else {
        i10nF = undefined;
        i10nNode = undefined;
    }


    const ht = cheerio.load(htmlF);

    const title = ht('title');
    if (title.length !== 1) {
        console.error('oldSC2.length !== 1');
        process.exit(-1);
        return;
    }

    const sC2Script = ht('script#script-sugarcube[type="text/javascript"]');
    if (sC2Script.length !== 1) {
        console.error('sC2Script.length !== 1');
        process.exit(-1);
        return;
    }

    if (i10nNode) {
        ht(i10nNode).insertBefore(sC2Script);
    }

    let sc2JsText = sC2Script.text();

    // window.SugarCube={},jQuery((()=>{
    // window.SugarCube={},window.mainStart=((()=>{
    const starHeadOld = `window.SugarCube={},jQuery((()=>{`;
    const startHeadNew = `window.SugarCube={},window.mainStart=((()=>{`;

    // }}))})(window,window.document,jQuery);}
    //
    const startTailOld = `}))})(window,window.document,jQuery);`;
    const startTailNew = `}))
// inject ModLoader on there
if (typeof window.modSC2DataManager !== 'undefined') {
window.modSC2DataManager.startInit().then(() => window.jsPreloader.startLoad()).then(() => {window.mainStart();window.initI10n(l10nStrings);}).catch(err => {console.error(err);});}else {window.mainStart();window.initI10n(l10nStrings);
}
    })(window,window.document,jQuery);`;

    if (sc2JsText.indexOf(starHeadOld) === -1) {
        console.error('Error: cannot find starHeadOld');
        process.exit(-1);
        return;
    }
    if (sc2JsText.indexOf(startTailOld) === -1) {
        console.error('Error: cannot find startTailOld');
        process.exit(-1);
        return;
    }

    sc2JsText = sc2JsText.replaceAll(starHeadOld, startHeadNew).replaceAll(startTailOld, startTailNew);

    if (sc2JsText.indexOf(starHeadOld) !== -1) {
        console.error('Error: replace sc2JsText failed');
        process.exit(-1);
        return;
    }
    if (sc2JsText.indexOf(startTailOld) !== -1) {
        console.error('Error: replace sc2JsText failed');
        process.exit(-1);
        return;
    }

    sC2Script.text(sc2JsText);

    const newHtmlF: string | null = ht.root().html();
    if (!newHtmlF) {
        console.error('!newHtmlF');
        process.exit(-1);
        return;
    }
    await promisify(fs.writeFile)(htmlPath + '.sc2patch.html', newHtmlF, {encoding: 'utf-8'});

    console.log('=== Congratulation! sc2patch done! Everything is ok. ===');
})().catch(e => {
    console.error(e);
    process.exit(-1);
});
