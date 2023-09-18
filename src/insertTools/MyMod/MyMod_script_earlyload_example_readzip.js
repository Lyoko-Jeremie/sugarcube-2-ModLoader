(async () => {
    // async自执行函数，会在mod加载前执行，并等待所有异步任务完成
    console.log('MyMod_script_earlyload_example_readzip.js', '  ', ' async自执行函数，会在mod加载前执行，并等待所有异步任务完成 ');

    const modUtils = window.modUtils;
    const modSC2DataManager = window.modSC2DataManager;

    const zips = modSC2DataManager.getModLoader().getModZip('MyMod');
    if (zips && zips.length > 0) {
        // 可以在这里读取当前mod的zip压缩包中的资源

        let selfZip;
        for (let i = 0; i < zips.length; i++) {
            const zip = zips[i];
            const info = zip.getModInfo();
            console.log('MyMod_script_earlyload_example_readzip.js', '  ', ' 通过 bootJson 寻找自己 ', [info], ' bootJson :', [info.bootJson]);
            if (/* 做一些搜索 */ true) {
                selfZip = zip;
                break;
            }
        }
        if (selfZip) {
            // 可以读取 zip 中的文件， 例如读取 addstionFile 中的某些文件 ， 或读取其他数据，再进行操作， 例如可以把从zip读取汉化数据并修改的passage的工作放在这里
            const contentReadme = await selfZip.getZipFile().file('readme.txt').async('string').catch((err) => {
                console.error(err);
                return undefined;
            });
            console.log('MyMod_script_earlyload_example_readzip.js', '  ', ' 读取到了 readme.txt ', [contentReadme]);
        }
    }


})();


