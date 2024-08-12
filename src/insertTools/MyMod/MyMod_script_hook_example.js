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

  const modSC2DataManager = window.modSC2DataManager;

  modSC2DataManager.getAddonPluginManager().registerAddonPlugin(
    'MyMod_script_hook_example',
    'MyMod_script_hook_example',
    {
      // 参见类型定义：src/BeforeSC2/AddonPlugin.ts
      // export type AddonPluginHookPointEx =
      //     AddonPluginHookPoint
      //     & AddonPluginHookPointExOptional
      //     & AddonPluginHookPointExMustImplement
      //     & AddonPluginHookPointWhenSC2;
      registerMod: async (addonName, mod, modZip) => {
        // 其他mod注册到本mod时执行
        // !!!!! 必须实现此钩子 !!!!!
        console.log('MyMod_script_hook_example.js', '  ', '其他mod注册到本mod时执行');
      },
      afterInjectEarlyLoad: async () => {
        // 所有 EarlyInject 脚本插入后
        // 可选钩子
        console.log('MyMod_script_hook_example.js', '  ', '所有 EarlyInject 脚本插入后');
      },
      afterModLoad: async () => {
        // 所有 mod 加载后 ， 且 LifeTimeCircleHook.afterModLoad 触发后
        // 可选钩子
        console.log('MyMod_script_hook_example.js', '  ', '所有 mod 加载后 ， 且 LifeTimeCircleHook.afterModLoad 触发后');
      },
      afterEarlyLoad: async () => {
        // 所有 EarlyLoad 脚本执行后
        // 可选钩子
        console.log('MyMod_script_hook_example.js', '  ', '所有 EarlyLoad 脚本执行后');
      },
      afterRegisterMod2Addon: async () => {
        // 所有 Mod 注册到 Addon 后
        // 可选钩子
        console.log('MyMod_script_hook_example.js', '  ', '所有 Mod 注册到 Addon 后');
      },
      beforePatchModToGame: async () => {
        // 所有 mod 数据覆盖到游戏前
        // 可选钩子
        console.log('MyMod_script_hook_example.js', '  ', '所有 mod 数据覆盖到游戏前');
      },
      afterPatchModToGame: async () => {
        // 所有 mod 数据覆盖到游戏后
        // 可选钩子
        console.log('MyMod_script_hook_example.js', '  ', '所有 mod 数据覆盖到游戏后');
      },
      afterPreload: async () => {
        // 所有 Preload 脚本执行后
        // 可选钩子
        console.log('MyMod_script_hook_example.js', '  ', '所有 Preload 脚本执行后');
      },
    },
  );

  modSC2DataManager.getModLoadController().addLifeTimeCircleHook(
    'MyMod_script_hook_example',
    {},
  )

})();


