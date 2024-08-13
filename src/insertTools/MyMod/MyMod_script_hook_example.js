(() => {
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

  const logger = modUtils.getLogger();

  logger.log('[MyMod_script_hook_example] 输出一段Log到ModLoaderGui日志');
  logger.warn('[MyMod_script_hook_example] 输出一段Warn到ModLoaderGui日志');
  logger.error('[MyMod_script_hook_example] 输出一段Error到ModLoaderGui日志');

  modSC2DataManager.getAddonPluginManager().registerAddonPlugin(
    'MyMod_script_hook_example',  //  mod名称
    'MyMod_script_hook_example',  // 插件名称，必须唯一，一个mod可以挂多个插件，可以使用mod名称
    {
      // 参见类型定义：src/BeforeSC2/AddonPlugin.ts
      // export type AddonPluginHookPointEx =
      //     AddonPluginHookPoint
      //     & AddonPluginHookPointExOptional
      //     & AddonPluginHookPointExMustImplement
      //     & AddonPluginHookPointWhenSC2;
      registerMod: async (addonName, mod, modZip) => {
        // 其他mod使用addonPlugin注册到本插件时执行
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
    'MyMod_script_hook_example',  // 钩子名称，必须唯一，一个mod可以挂多个钩子。可以直接使用mod名称
    {
      // 参见类型定义：src/BeforeSC2/ModLoadController.ts
      // export interface LifeTimeCircleHook extends Partial<ModLoadControllerCallback> {}
      // export interface ModLoadControllerCallback {}
      canLoadThisMod: async (bootJson, zip) => {
        // 检查并拦截mod加载，返回true则加载，返回false则不加载
        // 安全模式就是使用此钩子实现的
        // 可选钩子
        return true;
      },
      exportDataZip: async (zip) => {
        // 在debug模式导出mod数据，传入JSZip对象，返回插入了需要导出的数据后的JSZip对象
        // mod需要导出自定义数据时实现此钩子
        // 可选钩子
        return zip;
      },
      InjectEarlyLoad_start: async (modName, fileName) => {
        // 某Mod注入InjectEarlyLoad脚本前
        // 可选钩子
      },
      InjectEarlyLoad_end: async (modName, fileName) => {
        // 某Mod注入InjectEarlyLoad脚本后
        // 可选钩子
      },
      EarlyLoad_start: async (modName, fileName) => {
        // 某Mod执行EarlyLoad脚本前
        // 可选钩子
      },
      EarlyLoad_end: async (modName, fileName) => {
        // 某Mod执行EarlyLoad脚本后
        // 可选钩子
      },
      LazyLoad_start: async (modName) => {
        // 懒加载某Mod前
        // 可选钩子
      },
      LazyLoad_end: async (modName) => {
        // 懒加载某Mod后
        // 可选钩子
      },
      Load_start: async (modName, fileName) => {
        // 加载某Mod前
        // 可选钩子
      },
      Load_end: async (modName, fileName) => {
        // 加载某Mod后
        // 可选钩子
      },
      PatchModToGame_start: async () => {
        // 计算所有需要添加和覆盖的passage/js/css游戏数据前
        // 可选钩子
      },
      PatchModToGame_end: async () => {
        // 添加和覆盖的passage/js/css游戏数据后
        // 可选钩子
      },
      ReplacePatcher_start: async (modName, fileName) => {
        // 可选钩子，已弃用
      },
      ReplacePatcher_end: async (modName, fileName) => {
        // 可选钩子，已弃用
      },
      ModLoaderLoadEnd: async () => {
        // ModLoader加载完毕后
        // 这是SC2开始执行前，ModLoader启动完成后，游戏启动前，的最后一个钩子
        // 可选钩子
      },
    },
  );

  {
    // 如何修改Passage数据

    const passage1 = modUtils.getPassageData('aaaaa');
    if (passage1) {
      // 成功获得passage数据

      // passage 名称
      passage1.name;
      // passage id
      passage1.id;
      // passage tags ，一个字符串数组, 例如 [widget] ，这里就必须填 ['widget']，否则保持 [] 数组
      passage1.tags;
      // 例如
      passage1.tags = ['widget'];
      // passage 的文本内容
      passage1.content;
      // 执行文本操作
      passage1.content.replace('1234567890', '9876543210');

      // 将单个passage数据写回到SC2引擎的游戏数据中，这个函数效率很低，可以使用下面那个函数
      modUtils.updatePassageData(
        passage1.name,
        passage1.content,
        passage1.tags,
        passage1.id,
      );

      // 如果同时处理多个Passage，则不要使用上面的 `updatePassageData` ，可以调用这个 `updatePassageDataMany` 函数将多个passage数据写回到SC2引擎的游戏数据中
      // 参数是 需要更新的passage列表
      modUtils.updatePassageDataMany([passage1], true);
    } else {
      // 没有这个passage
    }
  }

})();


