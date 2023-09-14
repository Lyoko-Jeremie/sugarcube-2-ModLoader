;(() => {
    // 自执行函数，会在[Story/storyInit()]后执行
    console.log('MyMod_script_hook_example.js', '  ', '自执行函数，会在[Story/storyInit()]后执行');
    console.log('MyMod_script_hook_example.js', '  ', '由于此时引擎已经抓取所有模板数据，故无法在此处使用modUtils.updatePassageData更新passage');
    const modUtils = window.modUtils;

    $(document).one(":storyready", function () {
        // 后执行函数，引擎初始化完毕后会执行此处内容
        console.log('MyMod_script_hook_example.js', ' 在接收到JQuery的storyready事件时，说明SC2引擎已经启动完毕，所有的加载工作已经结束 ');
        // console.log('MyMod_script_hook_example.js', '  ');
    });

})();


