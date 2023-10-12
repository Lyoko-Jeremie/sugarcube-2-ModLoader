(() => {
    // 自执行函数，会在mod加载前执行
    console.log('MyMod_script_earlyload_example.js', '  ', '自执行函数，会在[Story/storyInit()]后执行');
    console.log('MyMod_script_earlyload_example.js', '  ', '此文件会在mod数据合并/注入/替换原始游戏数据前执行');
    const modUtils = window.modUtils;
    const modSC2DataManager = window.modSC2DataManager;

    // const ogrinPassageData = structuredClone(modSC2DataManager.getSC2DataInfoAfterPatch().passageDataItems.items);
    //
    // window.MyMod_PassageOverwrite = ogrinPassageData.map(T => {
    //     T.name;
    //     // TODO apply i18n passage replace on there
    //     T.content;
    //     return T;
    // });
    // console.log('MyMod_script_earlyload_example.js', '  ', window.MyMod_PassageOverwrite);

})();


