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
    const sc2JsPath = process.argv[3];
    console.log('htmlPath', htmlPath);
    console.log('sc2JsPath', sc2JsPath);
    if (!htmlPath) {
        console.error('no htmlPath');
        process.exit(-1);
        return;
    }
    if (!sc2JsPath) {
        console.error('no sc2JsPath');
        process.exit(-1);
        return;
    }
    const htmlF = await promisify(fs.readFile)(htmlPath, {encoding: 'utf-8'});
    const sc2JsF = await promisify(fs.readFile)(sc2JsPath, {encoding: 'utf-8'});

    if (sc2JsF.indexOf('window.storyFormat') === -1) {
        console.error('!sc2JsF.indexOf(\'window.storyFormat\')');
        process.exit(-1);
        return;
    }
    const storyFormatParseF = (data: { [key: string]: any }) => {
        return data;
    }
    const sc2Json: { [key: string]: any } = eval(sc2JsF.replace('window.storyFormat', 'storyFormatParseF'));
    // console.log('sc2Json', sc2Json);
    // for (const se in sc2Json) {
    //     console.log('se', se);
    // }
    if (!has(sc2Json, 'source')) {
        console.error('!has(sc2Json, \'source\')');
        process.exit(-1);
        return;
    }

    const ht = cheerio.load(htmlF);

    const title = ht('title');
    if (title.length !== 1) {
        console.error('oldSC2.length !== 1');
        process.exit(-1);
        return;
    }

    // {{STORY_NAME}} ->> title

    const sc2s = cheerio.load(sc2Json.source.replaceAll('{{STORY_NAME}}', title.text()));

    // const sc2sS: string | null = sc2s.root().html();
    // if (!sc2sS) {
    //     console.error('!sc2sS');
    //     process.exit(-1);
    //     return;
    // }
    // await promisify(fs.writeFile)(htmlPath + '.sc2sS.html', sc2sS, {encoding: 'utf-8'});

    const newSC2Script = sc2s('script#script-sugarcube[type="text/javascript"]');
    if (newSC2Script.length !== 1) {
        console.error('newSC2Script.length !== 1');
        process.exit(-1);
        return;
    }
    const newSC2ScriptLib = sc2s('script#script-libraries[type="text/javascript"]');
    if (newSC2ScriptLib.length !== 1) {
        console.error('newSC2ScriptLib.length !== 1');
        process.exit(-1);
        return;
    }

    // <script id="script-sugarcube" type="text/javascript">
    const oldSC2Script = ht('script#script-sugarcube[type="text/javascript"]');
    if (oldSC2Script.length !== 1) {
        console.error('oldSC2.length !== 1');
        process.exit(-1);
        return;
    }
    oldSC2Script.text(newSC2Script.text());

    // <script id="script-libraries" type="text/javascript">
    const oldSC2ScriptLib = ht('script#script-libraries[type="text/javascript"]');
    if (oldSC2ScriptLib.length !== 1) {
        console.error('oldSC2.length !== 1');
        process.exit(-1);
        return;
    }
    oldSC2ScriptLib.text(newSC2ScriptLib.text());

    const newHtmlF: string | null = ht.root().html();
    if (!newHtmlF) {
        console.error('!newHtmlF');
        process.exit(-1);
        return;
    }
    await promisify(fs.writeFile)(htmlPath + '.sc2replace.html', newHtmlF, {encoding: 'utf-8'});

    console.log('=== Congratulation! sc2Replace done! Everything is ok. ===');
})().catch(e => {
    console.error(e);
    process.exit(-1);
});
