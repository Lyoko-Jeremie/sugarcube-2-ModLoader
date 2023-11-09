import * as cheerio from 'cheerio';
import process from 'process';
import fs from 'fs';
import {basename} from 'path';
import {promisify} from 'util';
import {has} from 'lodash';

;(async () => {
    console.log('process.argv.length', process.argv.length);
    console.log('process.argv', process.argv);
    const htmlPath = process.argv[2];
    const jsPath = process.argv[3];
    console.log('htmlPath', htmlPath);
    console.log('jsPath', jsPath);
    if (!htmlPath) {
        console.error('no htmlPath');
        process.exit(-1);
        return;
    }
    if (!jsPath) {
        console.error('no jsPath');
        process.exit(-1);
        return;
    }
    const htmlF = await promisify(fs.readFile)(htmlPath, {encoding: 'utf-8'});
    const jsF = await promisify(fs.readFile)(jsPath, {encoding: 'utf-8'});

    const firstScriptIndex = htmlF.indexOf('<script');

    const polyfillJSContent = `<script id="polyfill-${basename(jsPath)}" type="text/javascript">${jsF}</script>`;

    const newHtmlF =
        htmlF.slice(0, firstScriptIndex) +
        '\n' + polyfillJSContent +
        '\n' + htmlF.slice(firstScriptIndex);

    const outputFilePath = htmlPath + `.polyfill-${basename(jsPath)}.html`;
    console.log(outputFilePath);
    await promisify(fs.writeFile)(outputFilePath, newHtmlF, {encoding: 'utf-8'});

    console.log('=== Congratulation! polyfillInsert done! Everything is ok. ===');
})().catch(e => {
    console.error(e);
    process.exit(-1);
});
