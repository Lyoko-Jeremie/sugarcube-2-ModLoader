import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import {} from 'lodash';

function checkAndProcessData(T: any) {
    if (T && T.typeB && T.typeB.TypeBOutputText && T.typeB.TypeBInputStoryScript) {
        return true;
    }
    return false;
};

;(async () => {
    console.log('process.argv.length', process.argv.length);
    console.log('process.argv', process.argv);
    const htmlPath = process.argv[2];
    const jsonPath = process.argv[3];
    console.log('htmlPath', htmlPath);
    console.log('jsonPath', jsonPath);
    if (!htmlPath) {
        console.error('no htmlPath');
        return;
    }
    if (!jsonPath) {
        console.error('no jsonPath');
        return;
    }
    const htmlF = await promisify(fs.readFile)(htmlPath, {encoding: 'utf-8'});
    const jsonF = await promisify(fs.readFile)(jsonPath, {encoding: 'utf-8'});
    // console.log('jsonF', jsonF.slice(0, 10));
    const data = JSON.parse(jsonF);
    if (!checkAndProcessData(data)) {
        console.error('(!checkAndProcessData(data)), json format invalid.');
        return;
    }
    const firstScriptIndex = htmlF.indexOf('<script');

    const objString = JSON.stringify(data);

    // create zip
    var zip = new JSZip();
    zip.file('i18nCnObj.json', JSON.stringify(data, undefined, ' '));
    const zipBase64 = await zip.generateAsync({
        type: "base64",
        compression: "DEFLATE",
        compressionOptions: {level: 9},
    });

    const insertContent1 = `<script type="text/javascript">window.i18nCnObj = ${objString};</script>`;
    const insertContent2 = `<script type="text/javascript">window.i18nCnZip = '${zipBase64}';</script>`;

    const newHtmlF =
        htmlF.slice(0, firstScriptIndex) +
        // '\n' + insertContent1 +
        '\n' + insertContent2 +
        '\n' + htmlF.slice(firstScriptIndex);

    await promisify(fs.writeFile)(htmlPath + '.new.html', newHtmlF, {encoding: 'utf-8'});

    await promisify(fs.writeFile)(htmlPath + '.zipBase64.zip', await zip.generateAsync({
        type: "uint8array",
        compression: "DEFLATE",
        compressionOptions: {level: 9},
    }), {encoding: 'utf-8'});
    await promisify(fs.writeFile)(htmlPath + '.zipBase64', zipBase64, {encoding: 'utf-8'});

})().catch((e) => {
    console.error(e);
});




