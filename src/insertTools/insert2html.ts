import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import {isArray, isString} from 'lodash';
import JSON5 from 'json5';

// insert zip to html top first script tag, then insert BeforeSC2 in second script tag.


export async function loadFileAsBase64(fPath: string) {
    const img = await promisify(fs.readFile)(fPath);
    const base64 = img.toString('base64');
    return base64;
}


;(async () => {
    console.log('process.argv.length', process.argv.length);
    console.log('process.argv', process.argv);
    const htmlPath = process.argv[2];
    const jsonPath = process.argv[3];
    const jsPath = process.argv[4];
    console.log('htmlPath', htmlPath);
    console.log('jsonPath', jsonPath);
    console.log('jsPath', jsPath);
    if (!htmlPath) {
        console.error('no htmlPath');
        process.exit(1);
        return;
    }
    if (!jsonPath) {
        console.error('no jsonPath');
        process.exit(1);
        return;
    }
    if (!jsPath) {
        console.error('no jsPath');
        process.exit(1);
        return;
    }
    const htmlF = await promisify(fs.readFile)(htmlPath, {encoding: 'utf-8'});
    const jsonF = await promisify(fs.readFile)(jsonPath, {encoding: 'utf-8'});
    const jsF = await promisify(fs.readFile)(jsPath, {encoding: 'utf-8'});
    // console.log('jsonF', jsonF.slice(0, 10));
    const data: string[] = JSON5.parse(jsonF);
    // data: path[]
    if (!(data && isArray(data) && data.every(isString))) {
        console.error('(!(data && isArray(data) && data.every(isString))), json format invalid.');
        process.exit(1);
        return;
    }
    const firstScriptIndex = htmlF.indexOf('<script');

    const modListStringObj: string[] = [];
    for (const modPath of data) {
        const fb = await loadFileAsBase64(modPath);
        modListStringObj.push(fb);
    }
    // remove CSP limit
    // CSP modify for mod update and other use-case
    const csp_findString = `content="default-src 'self' 'unsafe-eval' 'unsafe-inline'`;
    const csp_replaceString = `content="default-src 'self' 'unsafe-eval' 'unsafe-inline' *`;
    if (htmlF.indexOf(csp_findString) === -1) {
        console.error('csp_findString not found');
        process.exit(1);
    }
    const newHtmlF2 = htmlF.replace(csp_findString, csp_replaceString);

    const insertContent = `<script type="text/javascript">window.modDataValueZipList = ${JSON.stringify(modListStringObj)};</script>`;
    const insertJSContent = `<script type="text/javascript">${jsF}</script>`;

    const newHtmlF =
        newHtmlF2.slice(0, firstScriptIndex) +
        '\n' + insertContent +
        '\n' + insertJSContent +
        '\n' + newHtmlF2.slice(firstScriptIndex);

    await promisify(fs.writeFile)(htmlPath + '.mod.html', newHtmlF, {encoding: 'utf-8'});

    console.log('=== Congratulation! insert2html done! Everything is ok. ===');
})().catch((e) => {
    console.error(e);
    process.exit(1);
});

// remove CSP limit
// <meta
//   http-equiv="Content-Security-Policy"
//   content="default-src 'self' 'unsafe-eval' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:"/>

// content="default-src 'self' 'unsafe-eval' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:"
// content="default-src 'self' 'unsafe-eval' 'unsafe-inline' *; img-src 'self' data:; font-src 'self' data:"
