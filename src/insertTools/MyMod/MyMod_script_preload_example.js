(() => {
    // 自执行函数，会在mod插入html时执行此处内容
    console.log('MyMod_script_preload_example.js', '  ', '自执行函数，会在mod插入html时执行此处内容');
    const modUtils = window.modUtils;
    console.log('MyMod_script_preload_example.js', ' 获取mod列表 ', modUtils.getModListName());
    console.log('MyMod_script_preload_example.js', ' 获取所有Passage数据 ', modUtils.getAllPassageData());
    console.log('MyMod_script_preload_example.js', ' 获取指定名称的Passage数据 ', modUtils.getPassageData('Start'));
    console.log('MyMod_script_preload_example.js', ' 获取指定名称的Passage数据 ', modUtils.getPassageData('Start2'));
    console.log('MyMod_script_preload_example.js', ' 接下来插入一个Passage，如果Passage名称已存在，则会替换现有的Passage，这个插入操作只在SC2引擎启动前有效 ');

    // 添加一个Passage
    // :: MyMod_Passage_Dynamic1
    modUtils.updatePassageData('MyMod_Passage_Dynamic1', `
    <p>这是一个动态插入的Passage</p>
    `, [], 0);

    // 添加一个Widget
    // :: MyMod_Passage_Dynamic2 [widget]
    modUtils.updatePassageData('MyMod_Passage_Dynamic2', `
<<widget "MyMod_Passage_Dynamic2">><p>这是一个动态添加的widget</p><</widget>>
    `, ['widget'], 0);

    console.log('MyMod_script_preload_example.js', ' 注意，以上的插入操作每次只能插入一个Passage，如果需要插入多个Passage，需要多次调用updatePassageData方法 ');


    console.log('MyMod_script_preload_example.js', ' 可以在此处使用modUtils.getPassageData获取现有的Passage，稍作修改后再使用modUtils.updatePassageData进行替换 ');


    console.log('MyMod_script_preload_example.js', ' 在SC2引擎启动后，只能使用`Wikifier.wikifyEval("<<xxxxx>>")`以动态求值的方式，来动态添加Passage，或执行特定的Passage ');
    // Wikifier.wikifyEval("<<updateFeats>>", passageObj, passageTitle);
    console.log('MyMod_script_preload_example.js', ' Wikifier.wikifyEval的函数签名为：Wikifier.wikifyEval(source, passageObj, passageTitle)， 通常可以以 Wikifier.wikifyEval("source", undefined, "MyMod_Passage_Eval0001") 的方式调用 ');
    console.log('MyMod_script_preload_example.js',
        ' 在以 Wikifier.wikifyEval("source", undefined, "MyMod_Passage_Eval0001") 的方式调用时，表示现在正在执行一个动态passage，' +
        '它的名字是"MyMod_Passage_Eval0001"，其中"MyMod_Passage_Eval0001"是当前上下文的passageName，' +
        '而不是被调用的passsageName，在这里可以是任意的（与现有passageName不重复的）字符串内容 ');


    $(document).one(":storyready", function () {
        // 后执行函数，引擎初始化完毕后会执行此处内容
        console.log('MyMod_script_preload_example.js', ' 在接收到JQuery的storyready事件时，说明SC2引擎已经启动完毕，所有的加载工作已经结束，使用上面的updatePassageData方法更新后的内容也不会再被引擎加载 ');
        // console.log('MyMod_script_preload_example.js', '  ');
    });

    return Promise.resolve("MyMod_script_preload_example.js ok");
})();


