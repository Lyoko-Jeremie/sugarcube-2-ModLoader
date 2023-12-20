
# ModLoader

---

请从ModLoader/actions下载预编译版ModLoader：[ModLoader/actions](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/actions)   
或下载附带ModLoader的自动构建版DoL：[DoLModLoaderBuild](https://github.com/Lyoko-Jeremie/DoLModLoaderBuild/releases)   
Please download the precompiled version ModLoader from the ModLoader/actions：[ModLoader/actions](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/actions)    
Or download the DoL with ModLoader version automatic build ：[DoLModLoaderBuild](https://github.com/Lyoko-Jeremie/DoLModLoaderBuild/releases)

---

为了将与SugarCube2无关的功能与ModLoader核心功能分离，保持低耦合，为ModLoader的通用性提供保障。  
故将与ModLoader核心功能无关的功能分离为单独的Mod，并将部分常用mod以预置mod的方式提供。

现由ModLoader提供官方支持的Mod列表：

| Mod                                                                                                                      | 类型       | 状态         | 功能                                                                  |
|--------------------------------------------------------------------------------------------------------------------------|----------|------------|---------------------------------------------------------------------|
| [ModLoaderGui](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoaderGui)                                                | Built-in | Usable     | Mod管理器，用于管理Mod的加载顺序，启用/禁用Mod，以及查看Mod加载日志                            |
| [ConflictChecker](https://github.com/Lyoko-Jeremie/ConflictCheckerAddon)                                                 | Built-in | Stable     | Mod冲突检查器，提供附加的约束条件来检查Mod之间的冲突                                       |
| [ImageLoaderHook](https://github.com/Lyoko-Jeremie/DoL_ImgLoaderHooker)                                                  | Built-in | Stable     | 图片替换功能，用于替换游戏中的图片                                                   |
| [ReplacePatch](https://github.com/Lyoko-Jeremie/Degrees-of-Lewdity_Mod_ReplacePatch)                                     | Built-in | Stable     | 提供对js/css/passage的简单替换                                              |
| [I18nTweeList](https://github.com/Lyoko-Jeremie/I18nTweeListAddonMod)                                                    | Built-in | Stable     | 为tweeFileList提供i18n支持                                               |
| [I18nScriptList](https://github.com/Lyoko-Jeremie/I18nScriptListAddonMod)                                                | Built-in | Stable     | 为scriptFileList提供i18n支持                                             |
| [TweeReplacerLinker](https://github.com/Lyoko-Jeremie/TweeReplacerLinkerAddon)                                           | Built-in | Stable     | 链接TweeReplacer和I18nTweeReplacer，使得这两个mod共享替换顺序                      |
| [TweeReplacer](https://github.com/Lyoko-Jeremie/Degrees-of-Lewdity_Mod_TweeReplacer)                                     | Built-in | Stable     | 提供对passage的替换，可以使用正则表达式查找以及使用文件存储需替换的字符串                            |
| [I18nTweeReplacer](https://github.com/Lyoko-Jeremie/I18nTweeReplacerMod)                                                 | Built-in | Stable     | TweeReplacer的原生I18n支持版，可以为Mod作者提供原生i18n支持                           |
| [TweePrefixPostfixAddonMod](https://github.com/Lyoko-Jeremie/TweePrefixPostfixAddonMod)                                  | Built-in | Developing | 提供在Passage/Widget执行前后挂钩的能力                                          |
| [DoLHookWidgetMod](https://github.com/Lyoko-Jeremie/DoLHookWidgetMod)                                                    | Built-in | Stable     | 给DoL自定义的Widget打TweePrefixPostfix需要的补丁                               |
| [SweetAlert2Mod](https://github.com/Lyoko-Jeremie/SweetAlert2Mod)                                                        | Built-in | Stable     | 为mod加密等功能提供通用弹出提示框，简单封装[SweetAlert2](https://sweetalert2.github.io) |
| [CheckGameVersion](https://github.com/Lyoko-Jeremie/Degrees-of-Lewdity_Mod_CheckGameVersion)                             | Built-in | Stable     | 为依赖检查功能中的游戏版本检查功能提供DoL适配                                            |
| [CheckDoLCompressorDictionaries](https://github.com/Lyoko-Jeremie/Degrees-of-Lewdity_Mod_CheckDoLCompressorDictionaries) | Built-in | Stable     | 对DoL的数据压缩字典进行检查，并警告用户字典变更                                           |
| [Diff3WayMerge](https://github.com/Lyoko-Jeremie/Mod_Diff3WayMerge)                                                      | Built-in | Developing | 基于git的Diff3Way算法实现的passage合并功能，仍在开发阶段                               |
| [ModdedClothesAddon](https://github.com/Lyoko-Jeremie/DoL_ModdedClothesAddon)                                            | Built-in | Stable     | DoL的快速服装添加工具                                                        |
| [ModdedFeatsAddon](https://github.com/Lyoko-Jeremie/DoL_ModdedFeatsAddon)                                                | Built-in | Stable     | DoL的快速成就添加工具                                                        |
| [ModdedHairAddon](https://github.com/Lyoko-Jeremie/DoL_ModdedHairAddon)                                                  | Built-in | Stable     | DoL的快速发型添加工具                                                        |
| [ModuleCssReplacer](https://github.com/Lyoko-Jeremie/DoL_ModuleCssReplacerAddon)                                         | Built-in | Deprecate  | Css替换器，解决无法使用标准方法替换DoL使用的Module/css问题而专门设计(有重大性能问题，请勿使用)            |
| [PhoneDebugToolsEruda](https://github.com/Lyoko-Jeremie/PhoneDebugToolsErudaMod)                                         | External | Stable     | 手机调试工具，对 [Eruda](https://github.com/liriliri/eruda) 的简单封装           |
| [i18n](https://github.com/Lyoko-Jeremie/Degrees-of-Lewdity_Mod_i18nMod)                                                  | External | Stable     | i18n中文翻译Mod，其他语种基于此mod进行简单修改即可使用                                    |
| [CryptoI18n](https://github.com/Lyoko-Jeremie/CryptoI18nMod)                                                             | Example  | Demo       | v2.0.0 版本的mod加密功能的demo。以i18n mod作为范例。                               |
| [ExampleModModifyMod](https://github.com/Lyoko-Jeremie/ExampleModModifyMod)                                              | Example  | Demo       | 关于如何使用Mod B读取并修改Mod A的数据和行为的示范Mod                                   |
| [SimpleCryptWrapper](https://github.com/Lyoko-Jeremie/SimpleCryptWrapperMod)                                             | Tools    | Stable     | 一个简易Mod加密封装工具，用来将另一个mod封装成在加载时需要输入解密密码的加密mod，设计用来保护图片资源             |

有关各个mod的功能及用法，详见对应mod项目的README.md文件。

---

* [ModLoader](#ModLoader)
  * [简介](#简介)
  * [有关安全模式(SafeMode)的使用提示](#有关安全模式safemode的使用提示)
  * [如何制作 Mod.zip 文件](#如何制作-modzip-文件)
      * [注意事项](#注意事项)
  * [如何打包Mod](#如何打包mod)
    * [手动打包方法](#手动打包方法) <========= **最简单的打包Mod方法**， 若没有NodeJs环境，请使用此方法
    * [自动打包方法](#自动打包方法)
  * [ModLoader开发及修改方法](#ModLoader开发及修改方法)
  * [有关SC2注入点](#有关SC2注入点)
  * [如何不重新编译直接替换编译后游戏的SC2引擎](#如何不重新编译直接替换编译后游戏的sc2引擎)

---

# 简介

此项目是为 SugarCube-2 引擎编写的Mod加载器，初衷是为 [Degrees-of-Lewdity] 设计一个支持Mod加载和管理的Mod框架，支持加载本地Mod、远程Mod、旁加载Mod（从IndexDB中加载）。  
This project is a ModLoader written for the SugarCube-2 engine.
The original intention was to design a mod framework that supports mod loading and management for [Degrees-of-Lewdity],
which includes support for loading local mods, remote mods, and side-loaded mods (load from IndexDB).

本项目的目的是为了方便制作Mod以及加载Mod，同时也为了方便制作Mod的开发者，提供了一些API来方便读取和修改游戏数据。   
The purpose of this project is to facilitate the creation and loading of mods, as well as to provide convenience for mod developers.
It includes some APIs to easily access and modify game data.

本项目由于需要在SC2引擎启动前注入Mod，故对SC2引擎做了部分修改，添加了ModLoader的引导点，以便在引擎启动前完成Mod的各项注入工作。   
This project has made some modifications to the SC2 engine because it needs to inject mods before the SC2 engine starts.
It has added entry points for the ModLoader to ensure that all mod injection tasks are completed before the engine starts.

修改过的 SC2 在此处：[sugarcube-2](https://github.com/Lyoko-Jeremie/sugarcube-2_Vrelnir) ，使用此ModLoader的游戏需要使用此版本的SC2引擎才能引导本ModLoader。   
The modified SC2 engine can be found here: [sugarcube-2](https://github.com/Lyoko-Jeremie/sugarcube-2_Vrelnir).
To use this ModLoader for games, you need to use this version of the SC2 engine in order to properly load the ModLoader.

具体有关如何打包一个带有ModLoader的游戏本体的方法，详见 [ModLoader开发及修改方法](#ModLoader开发及修改方法) 。   
For specific instructions on how to package a game with the ModLoader,
please refer to the details provided in the section titled "ModLoader Development and Modification Methods"
under [ModLoader Development and Modification Methods](#ModLoader开发及修改方法).

---

# 有关安全模式(SafeMode)的使用提示

若因未知问题触发故障导致ModLoader无法正常完成加载，请连续触发3次故障后，再次进入游戏时，ModLoader会启动安全模式自动关闭所有Mod，以便您可以正常打开Mod管理器以便卸载可能触发故障的mod。

If ModLoader fails to load due to an unknown issue, trigger the fault three times.
On the next game entry, ModLoader will entry `safe mode` to disable all mods.
You can then access the Mod Manager to remove the problematic mod.


---

# 如何制作 Mod.zip 文件：  
How to create a Mod.zip file:

给自己的mod命名  
Name your own mod.

以mod名字组织自己的mod  
Organize your mod with the mod's name.

编写mod的引导描述文件 boot.json 文件  
Write the boot description file boot.json for your mod.

格式如下（样例 src/insertTools/MyMod/boot.json）：  
The format is as follows (sample src/insertTools/MyMod/boot.json):


```json5
{
  "name": "MyMod",    // （必须存在） mod名字
  "version": "1.0.0", // （必须存在） mod版本
  "scriptFileList_inject_early": [  // （可选） 提前注入的 js 脚本 ， 会在当前mod加载后立即插入到dom中由浏览器按照script的标注执行方式执行
    "MyMod_script_inject_early_example.js"
  ],
  "scriptFileList_earlyload": [     // （可选） 提前加载的 js 脚本 ， 会在当前mod加载后，inject_early脚本全部插入完成后，由modloader执行并等待异步指令返回，可以在这里读取到未修改的Passage的内容
    "MyMod_script_earlyload_example.js"
  ],
  "scriptFileList_preload": [     // （可选） 预加载的 js 脚本文件 ， 会在引擎初始化前、mod的数据文件全部加载并合并到html的tw-storydata中后，由modloader执行并等待异步指令返回， 可以在此处调用modloader的API读取最新的Passage数据并动态修改覆盖Passage的内容
    "MyMod_script_preload_example.js"     // 注意 scriptFileList_preload 文件有固定的格式，参见样例 src/insertTools/MyMod/MyMod_script_preload_example.js
  ],
  "styleFileList": [      // （必须存在） css 样式文件
    "MyMod_style_1.css",
    "MyMod_style_2.css"
  ],
  "scriptFileList": [     // （必须存在） js 脚本文件，这是游戏的一部分
    "MyMod_script_1.js",
    "MyMod_script_2.js"
  ],
  "tweeFileList": [       // （必须存在） twee 剧本文件
    "MyMod_Passage1.twee",
    "MyMod_Passage2.twee"
  ],
  "imgFileList": [        // （必须存在） 图片文件，尽可能不要用容易与文件中其他字符串混淆的文件路径，否则会意外破坏文件内容
    "MyMod_Image/typeAImage/111.jpg",
    "MyMod_Image/typeAImage/222.png",
    "MyMod_Image/typeAImage/333.gif",
    "MyMod_Image/typeBImage/111.jpg",
    "MyMod_Image/typeBImage/222.png",
    "MyMod_Image/typeBImage/333.gif"
  ],
  "additionFile": [     // （必须存在） 附加文件列表，额外打包到zip中的文件，此列表中的文件不会被加载，仅作为附加文件存在。
                        //  请注意，这里的文件会以被当作文本文件以utf-8编码读取并保存
    "readme.txt"      // 第一个以readme(不区分大小写)开头的文件会被作为mod的说明文件，会在mod管理器中显示
  ],
  "additionBinaryFile": [   // 附加二进制文件
    "xxxx.zip"          // 如果有需要附加的二进制文件，编写在这里时 `packModZip.ts` 会将其以二进制格式保存
  ],
  "additionDir": [    // 附加文件夹
    "xxxx"            // 如果有需要附加的文件夹，编写在这里时 `packModZip.ts` 会将其下所有问题以二进制格式保存
  ],
  "addonPlugin": [      // （可选） 依赖的插件列表，在此声明本mod依赖哪些插件，在此处声明后会调用对应的插件，不满足的依赖会在加载日志中产生警告
    {           //  需要首先由提供插件的mod在EarlyLoad阶段注册插件，否则会找不到插件
      "modName": "MyMod2",    // 插件来自哪个mod
      "addonName": "addon1",   // 在那个mod中的插件名
      "modVersion": "1.0.0",    // 插件所在mod的版本
      "params": []              // （可选） 插件参数
    }
  ],
  "dependenceInfo": [     // （可选） 依赖的mod列表，可以在此声明此mod依赖哪些前置mod，不满足的依赖会在加载日志中产生警告
    {
      "modName": "ModLoader DoL ImageLoaderHook",   // 依赖的mod名字
      "version": "^2.0.0"                           // 依赖的mod版本
      // 对于版本号声明格式的简单说明：
      //    版本号是以逗号为分隔的数字，比较时从左往右逐个逗号进行比较。
      //    通常是3个数字组成，第一个数字表示大版本，出现破坏性（不向前兼容的）变更时数值加一，第二个数字表示小版本，有新功能时数值加一，第三个数字表示修订版本，修复bug时数值加一。
      //    以"^"开头表示从此大版本开始到下一个大版本结束的范围，这是推荐的默认依赖写法。
      //    以"="或不带任何前缀表示只依赖指定的版本号。
      //    以"> < >= <="这种不等式写法符合对应的数学语义。
      //    
    },
    {
      "modName": "ModLoaderGui",
      "version": "^1.0.8"                          // 依赖的mod版本，使用(https://www.npmjs.com/package/semver)检查版本号，符合`语义化版本控制规范` (https://semver.org/lang/zh-CN/)
    },
    // 除了以上的方法可以声明对普通Mod的依赖，还有下面两个特殊的对 ModLoader 版本和 游戏版本 的依赖声明
    {
      "modName": "ModLoader",     // 部分Mod可能需要依赖从特定ModLoader版本开始才添加进ModLoader的API，例如大部分AddonMod，可以像这样声明对ModLoader版本的依赖
      "version": "^1.6.0"
    },
    {
      "modName": "GameVersion",   // 部分Mod只能在特定游戏版本下才能正常工作，可以像这样声明对游戏版本的依赖。特别注意这里以等号开头表示只匹配特定版本的游戏。此处比较时只会比较游戏的本体版本号，忽略第一个"-"开始的所有后缀。
      "version": "=0.4.2.7"
    }
  ]
}

```

最小 boot.json 文件样例：  
Minimum boot.json file example:

```json
{
  "name": "EmptyMod",
  "version": "1.0.0",
  "styleFileList": [
  ],
  "scriptFileList": [
  ],
  "tweeFileList": [
  ],
  "imgFileList": [
  ],
  "additionFile": [
    "readme.txt"
  ]
}
```

### 注意事项

1. boot.json 文件内的路径都是相对路径，相对于zip文件根目录的路径。
2. 图片文件的路径是相对于zip文件根目录的路径。
3. 同一个mod内的文件名不能重复，也尽量不要和原游戏或其他mod重复。与原游戏重复的部分会覆盖游戏源文件。
4. 具体的来说，mod会按照mod列表中的顺序加载，靠后的mod会覆盖靠前的mod的passage同名文件，mod之间的同名css/js文件会直接将内容concat到一起，故不会覆盖css/js等同名文件。
5. 加载时首先计算mod之间的覆盖，（互相覆盖同名passage段落，将同名js/css连接在一起），然后将结果覆盖到原游戏中（覆盖原版游戏的同名passage/js/css）
6. 当前版本的mod加载器的工作方式是直接将css/js/twee文件按照原版sc2的格式插入到html文件中。

..

1. Paths in the boot.json file are all relative paths, relative to the root directory of the zip file.
2. The paths to image files are relative to the root directory of the zip file.
3. File names within the same mod must not be duplicated, and it's advisable to avoid naming conflicts with the original game or other mods. Parts that overlap with the original game will overwrite game source files.
4. Specifically, mods are loaded in the order they appear in the mod list. Mods further down the list will overwrite passage files with the same name from mods higher up the list. Files with the same name in CSS and JS between mods will have their contents concatenated, so they won't overwrite each other.
5. During loading, mod overlaps are calculated first (overlapping passage paragraphs from different mods, concatenating same-named js/css), and the result is overlaid onto the original game (overwriting same-named passage/js/css of the original game).
6. The current version of the mod loader works by directly inserting CSS/JS/Twee files into the HTML file in the original SC2 format.

---


对于一个想要修改passage的mod，有这么4个可以修改的地方
1. scriptFileList_inject_early ， 这个会在当前mod读取之后，“立即”插入到script脚本由浏览器按照script标签的标准执行，这里可以调用ModLoader的API，可以读取未经修改的SC2 data （包括原始的passage）
2. scriptFileList_earlyload  ，这个会在当前mod读取之后，inject_early 脚本插入完之后，由modloader执行并等待异步指令返回，这里可以调用ModLoader的API，可以执行异步操作，干一些远程加载之类的活，也可以在这里读取未经修改的SC2 data（包括原始的passage）
3. tweeFileList ，这个是mod的主体，会在modloader读取所有mod之后，做【1 合并所有mod追加的数据，2 将合并结果覆盖到原始游戏】的过程应用修改到原始游戏SC2 data上
4. scriptFileList_preload ， 这个会在mod文件全部应用到SC2 data之后由modloader执行并等待异步操作返回，这里可以像earlyload一样做异步工作，也可以读取到mod应用之后的SC2 data

上面的步骤结束之后SC2引擎才会开始启动，读取SC2 data，然后开始游戏，整个步骤都是在加载屏幕（那个转圈圈）完成的。

For a mod that wants to modify passages, there are four places you can make modifications:
1. `scriptFileList_inject_early`: This is inserted "immediately" after the current mod is loaded. It is executed by the browser following the standard of script tags. You can call the ModLoader's API here and read unmodified SC2 data, including the original passages.
2. `scriptFileList_earlyload`: This is executed after the current mod is loaded and `inject_early` scripts are inserted. ModLoader executes this and waits for asynchronous instructions to return. You can call the ModLoader's API here, perform asynchronous operations, such as remote loading, and also read unmodified SC2 data, including the original passages.
3. `tweeFileList`: This is the main part of the mod and is applied to the original SC2 data by ModLoader after it reads all mods. It goes through a process of combining all appended data from mods and then overlaying the combined result onto the original game's SC2 data. This is where you apply modifications to the original passages.
4. `scriptFileList_preload`: This is executed by ModLoader after all mod files have been applied to the SC2 data. It waits for asynchronous operations to return. Here, you can perform asynchronous tasks similar to `earlyload` and read the SC2 data after mod application.

After these steps are completed, the SC2 engine starts, reads the SC2 data, and begins the game. The entire process takes place during the loading screen (the spinning wheel).

---

另，由于SC2引擎本身会触发以下的一些事件，故可以使用jQuery监听这些事件来监测游戏的变化  
Additionally, since the SC2 engine itself triggers certain events, you can use jQuery to listen to these events to monitor changes in the game.

```
// 游戏完全启动完毕
:storyready
// 一个新的 passage 上下文开始初始化
:passageinit
// 一个新的 passage 开始渲染
:passagestart
// 一个新的 passage 渲染结束
:passagerender
// 一个新的 passage 准备插入到HTML
:passagedisplay
// 一个新的 passage 已经处理结束
:passageend
```

可以以下方法监听jQuery事件
```js
$(document).one(":storyready", () => {
   // ....... 触发一次
});
$(document).on(":storyready", () => {
   // ....... 触发多次
});
```
---

### 变更：

【2023-09-21】 删除 `imgFileReplaceList` ，现在使用新的ImageHookLoader直接拦截图像请求来实现图像替换，因此，与原始图像文件重名的图像会被覆盖

【2023-09-23】 添加 `addonPlugin` ，添加 `dependenceInfo`

现在可以使用 `dependenceInfo` 来声明依赖的mod，不满足的声明会在加载日志中显示警告

可以使用 `addonPlugin` 来声明依赖的插件，会在 `EarlyLoad` 之后 `PatchModToGame` 之前将所有需要依赖插件的Mod注册给插件，  
故所有提供插件的`插件Mod`（或者说`lib mod`）需要最迟在 `EarlyLoad` 阶段（喜欢的话也可以在`InjectEarlyLoad`阶段）
调用 `window.modAddonPluginManager.registerAddonPlugin()` 将自己提供的插件注册到 `AddonPluginManager` 。

【2023-10-14】 BreakChange ：破坏性变更：为了支持 "安全模式" 和 "Mod禁用功能" ，调整了 `InjectEarlyLoad` 的加载实现以及Mod加载行为。  

调整了 `AddonPluginHook` 的触发顺序， `afterModLoad` 会在 `afterInjectEarlyLoad` 且 ` LifeTimeCircleHook.afterModLoad`  执行后触发。  
所以，如果一个Mod需要等待其他Mod对自己修改后再执行操作（例如Mod对Mod的i18n），可以在`afterInjectEarlyLoad`中或`EarlyLoad`时再执行自己的任务。

现在 ModLoader 会读取所有Mod，然后在 `InjectEarlyLoad` 每一个Mod后立即使用剩余未InjectEarlyLoad的Mod列表调用所有已加载Mod的`canLoadThisMod`来过滤接下来要加载的Mod。  
即，先加载的Mod可以决定剩下还未加载的Mod是否需要继续加载，但对于已经加载的Mod没有过滤能力。

【2023-10-08】 v1.6.0 使用 `HtmlTagSrcHook` 支持替换游戏中由 SC2 引擎创建的所有 html img 标签引用的图片。在此之前只有canvas绘图引用的图片才会被替换。

通过对 SC2 引擎的 `Wikifier.Parser.add 'htmlTag' ` 添加如下的代码来在创建`<IMG>`标签前拦截图片请求并交由ModLoader进行处理，来实现拦截并替换图片的功能。

```js
if (typeof window.modSC2DataManager !== 'undefined' &&
	typeof window.modSC2DataManager.getHtmlTagSrcHook?.()?.doHook !== 'undefined') {
	if (tagName === 'img' && !el.getAttribute('src')?.startsWith('data:')) {
		// need check the src is not "data:" URI
		el.setAttribute('ML-src', el.getAttribute('src'));
		el.removeAttribute('src');
		// call img loader on there
		window.modSC2DataManager.getHtmlTagSrcHook().doHook(el).catch(E => console.error(E));
	}
}

// 以下这行是SC2原始代码，上面添加的代码需要插入在这一行之前
output.appendChild(tagName === 'track' ? el.cloneNode(true) : el);
```

`ModLoader DoL ImageLoaderHook` 已经添加了这个功能的支持，只需要像之前那样正常使用即可。

_使用此功能可以通过自行注册 `HtmlTagSrcHook` 钩子，或者使用 v2.3.0 以上版本的 `ModLoader DoL ImageLoaderHook` 。_

注：游戏 DoL 仍然存在部分没有拦截到的图片，这些图片由 DoL 自行添加了 `Macro.add("icon",` **icon** 标签来实现的。这些代码几乎全是在 link 前使用的标签。


【2023-10-23】 BreakChange ： 破坏性变更： v2.0.0 修正mod排序问题； 为Mod加密功能添加 SideLazyLoad API 。

`modOrder` 数据结构发生重大变化。    
为了保证向后（未来）兼容性，现在开始不允许直接访问`modOrder`。请使用以下两个API
* `ModLoader.getModByNameOne('mod name')` 使用modName查询Mod
* `ModLoader.getModZip('mod name')` 使用modName查询ModZip
* `ModLoader.getModEarlyLoadCache()` 在`EarlyLoad`阶段安全地读取已经加载的mod快照

以下是ModCache的低级查询/遍历方法，请注意以下方法不能在`EarlyLoad`阶段使用
* `ModLoader.getModCacheMap()` 以Map的方式使用modName查询，返回ReadOnlyMap
* `ModLoader.getModCacheOneArray()`  以Array的方式遍历，对返回的Array的修改不会应用到ModLoader内部数据
* `ModLoader.getModCacheArray()`
* `ModLoader.getModCacheByNameOne()` 以modName查询
* `ModLoader.checkModCacheUniq()`    检查数据是否唯一，请在手动修改后调用此API验证数据
* `ModLoader.checkModCacheData()`    检查内部数据是否一致，请在手动修改后调用此API验证数据

【2023-10-23】 BreakChange: Destructive Change: v2.0.0 fixes the mod sorting issue; introduces the SideLazyLoad API for Mod encryption.

The `modOrder` data structure has undergone significant changes.  
To ensure backward (future) compatibility, direct access to `modOrder` is now prohibited. Please use the following two APIs:
* `ModLoader.getModByNameOne('mod name')` - Query a Mod using modName.
* `ModLoader.getModZip('mod name')` - Query ModZip using modName.
* `ModLoader.getModEarlyLoadCache()` - Safely read loaded mod snapshots during the `EarlyLoad` phase.

Below are the low-level query/traversal methods for ModCache. Please note that these methods cannot be used during the `EarlyLoad` phase:
* `ModLoader.getModCacheMap()` - Query using modName in a Map format, returns a ReadOnlyMap.
* `ModLoader.getModCacheOneArray()` - Traverse in an Array format; modifications to the returned Array won't affect the internal data of ModLoader.
* `ModLoader.getModCacheArray()`
* `ModLoader.getModCacheByNameOne()` - Query using modName.
* `ModLoader.checkModCacheUniq()` - Check if the data is unique; call this API to validate data after manual modifications.
* `ModLoader.checkModCacheData()` - Check if the internal data is consistent; call this API to validate data after manual modifications.


【2023-09-21】 Delete `imgFileReplaceList`. Now, use the new ImageHookLoader to intercept image requests directly for image replacement. Therefore, images with the same name as the original image files will be overwritten.

【2023-09-23】 Add `addonPlugin`. Add `dependenceInfo`.

You can now use `dependenceInfo` to declare dependencies on mods. Declarations that are not met will display warnings in the loading log.  
You can use `addonPlugin` to declare dependencies on plugins. All mods that need to depend on plugins will be registered with the plugin after `EarlyLoad` but before `PatchModToGame`.
Therefore, all mods that provide plugins (or "lib mods") should call `window.modAddonPluginManager.registerAddonPlugin()` to register their provided plugins with the `AddonPluginManager` no later than in the `EarlyLoad` phase (or optionally in the `InjectEarlyLoad` phase).


---

## 如何打包Mod  
how to pack mod

### 手动打包方法  
Manual Packaging Method


这个方法只需要有一个可以压缩Zip压缩包的压缩工具，和细心的心。  
This method only requires a compression tool capable of creating Zip archives and attention to detail.

1. 使用你喜爱的编辑器，编辑好boot.json文件  
Use your preferred text editor to edit the boot.json file.

2. 在boot.json文件根目录使用压缩工具（例如如下例子中使用的 [7-Zip](7-zip.org/)，其他软件方法类似），**仔细选择 boot.json 以及在其中引用的文件打包成zip文件**  
Using a compression tool in the root directory of the boot.json file (for example, as demonstrated below using [7-Zip](7-zip.org/)), **carefully select boot.json and the referenced files within it to create a Zip archive**.

![](https://raw.githubusercontent.com/wiki/Lyoko-Jeremie/sugarcube-2-ModLoader/fast/step1.png)

3. 设置压缩参数（**格式Zip，算法Deflate，压缩等级越大越好，没有密码**）   
Configure the compression parameters as follows: **Zip format, Deflate algorithm, maximum compression level, and no password.**

![](https://raw.githubusercontent.com/wiki/Lyoko-Jeremie/sugarcube-2-ModLoader/fast/step2.png)

4. 点击确定，等待压缩完成  
Click "OK" and wait for the compression to complete.

5. 压缩后请打开压缩文件再次检查：（**boot.json 文件在根目录**，boot.json中编写的文件路径和压缩完毕之后的结构**一模一样**，任何一个文件的压缩算法只能是**Store或Deflate**）  
After compression, please open the compressed file and double-check that: ( **The boot.json file is in the root directory**. The file paths written in boot.json **match** the structure after compression exactly. The compression algorithm for any file should be either **Store or Deflate**. )

![](https://raw.githubusercontent.com/wiki/Lyoko-Jeremie/sugarcube-2-ModLoader/fast/step3.png)


6. 重命名压缩包为 mod名字.mod.zip  （这一步**可选**）  
Rename the compressed package to `modname.mod.zip`. (This step is **optional**.)

7. 使用Mod管理器加载Mod  
Load the Mod using the Mod manager.

### 自动打包方法

这个方法需要有NodeJs和Yarn使用知识

打包：

编译脚本

```shell
yarn run webpack:insertTools
```

切换到 Mod 所在文件夹，（即boot.json所在文件夹）
```shell
cd src/insertTools/MyMod
```

执行

```shell
node "<packModZip.js 文件路径>" "<boot.json 文件路径>"
```

例如：

```shell
node "H:\Code\sugarcube-2\ModLoader\dist-insertTools\packModZip.js" "boot.json"
```

之后会在当前目录下打包生成一个以boot.js文件中的mod名命名的zip文件，例如：

```
MyMod.mod.zip
```


---

# ModLoader开发及修改方法

**以下是关于如何修改ModLoader本体、如何将ModLoader本体以及插入到游戏中、如何将预装Mod嵌入到Html中的方法。若仅仅制作Mod，仅需按照以上方法[打包Mod](#如何打包mod)即可在Mod管理界面加载zip文件。**

---

本项目由于需要在SC2引擎启动前注入Mod，故对SC2引擎做了部分修改，添加了ModLoader的引导点，以便在引擎启动前完成Mod的各项注入工作。

修改过的 SC2 在此处：[sugarcube-2](https://github.com/Lyoko-Jeremie/sugarcube-2_Vrelnir) ，使用此ModLoader的游戏需要使用此版本的SC2引擎才能引导本ModLoader。

可在SC2游戏引擎项目中执行 `build.js -d -u -b 2` 来编译SC2游戏引擎，编译结果在SC2游戏引擎项目的 `build/twine2/sugarcube-2/format.js` ，
将其覆盖 [Degrees-of-Lewdity] 游戏的原版 `devTools/tweego/storyFormats/sugarcube-2/format.js` ，编译原版游戏本体获得带有ModLoader引导点的Html游戏文件，
随后按照下方的方法编译并注入此ModLoader到Html游戏文件，即可使用此ModLoader。

---

编译脚本

```shell
yarn run webpack:BeforeSC2
yarn run ts:ForSC2
yarn run webpack:insertTools
```

如何插入Mod加载器以及将预装Mod内嵌到html文件：

编写 modList.json 文件，格式如下：
（样本可参见 src/insertTools/modList.json ）
```json
[
  "mod1.zip",
  "mod2.zip"
]
```


切换到 modList.json 所在文件夹

```shell
cd ./src/insertTools/modList.json
```

```shell
node "<insert2html.js 文件路径>" "<Degrees of Lewdity VERSION.html 文件路径>" "<modList.json 文件>" "<BeforeSC2.js 文件路径>"
```

例如：

```shell
node "H:\Code\sugarcube-2\ModLoader\dist-insertTools\insert2html.js" "H:\Code\degrees-of-lewdity\Degrees of Lewdity VERSION.html" "modList.json" "H:\Code\sugarcube-2\ModLoader\dist-BeforeSC2\BeforeSC2.js"
```

会在原始html文件同目录下生成一个同名的html.mod.html文件，例如：
```
Degrees of Lewdity VERSION.html.mod.html
```
打开`Degrees of Lewdity VERSION.html.mod.html`文件， play


---

## 附NodeJs及Yarn环境安装方法

1. 从 [NodeJs 官网](https://nodejs.org) 下载NodeJs并安装，例如 [node-v18.18.0-x64.msi](https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi)
2. 在命令行运行 `corepack enable` 来启用包管理器支持
3. 结束


---

## 有关SC2注入点

ModLoader所需的唯一一个注入点是 [sugarcube.js](https://github.com/Lyoko-Jeremie/sugarcube-2_Vrelnir/blob/TS/src/sugarcube.js) 文件中的jQuery启动处

```js
/* eslint-enable no-unused-vars */

/*
	Global `SugarCube` object.  Allows scripts to detect if they're running in SugarCube by
	testing for the object (e.g. `"SugarCube" in window`) and contains exported identifiers
	for debugging purposes.
*/
window.SugarCube = {};

/*
	Main function, entry point for the story.
*/
jQuery(() => {
	'use strict';

	const mainStart = () => {
	    // 原来的 `jQuery(() => {}) `的内容
	};

	// inject ModLoader on there
	if (typeof window.modSC2DataManager !== 'undefined') {
		window.modSC2DataManager.startInit()
			.then(() => window.jsPreloader.startLoad())
			.then(() => mainStart())
			.catch(err => {
				console.error(err);
			});
	}
	else {
		mainStart();
	}
});
```

需要使用异步等待的方式，让原本的引擎启动逻辑等待ModLoader的初始化完毕，并等待ModLoader完成加载所有mod、执行mod注入脚本等待等的工作，之后才能执行原本的引擎启动逻辑。



---

## 技术说明

### 加载顺序


ModLoader会从4个地方加载mod
1. html文件内嵌的【local】
2. 远程web服务器【remote】 （如果是使用web服务器打开并且能读取到服务器上的modList.json）
3. localStorage旁加载，上传文件（限制大小，所以现在没有使用）【localStorage】
4. IndexDB旁加载，上传文件（现在用的）【IndexDB】

按照1234的顺序加载Mod，如果有同名Mod，后加载的会替代先加载的

### Mod、ModLoader、引擎、游戏 三者的结构

ModLoader和游戏的关系大约是 `((sc2引擎 + 游戏本体)[游戏] + (ModLoader + Mod)[Mod框架])` 这个结构

其中的 `Mod框架` 又细分为

```
(  
    (
        ModLoader + 
        (
            ModLoaderGui[Mod管理器界面] +
            Addon[扩展插件]
        )[预置Mod]
    )[植入到html] +  其他Mod[上传或者远程加载] 
 )
```

要使用ModLoader玩游戏，需要使用经过修改的SC2引擎，例如 [这里](https://github.com/Lyoko-Jeremie/sugarcube-2_Vrelnir)，  
其中最关键的部分就是上方的[SC2注入点](#有关SC2注入点)，ModLoader需要这个注入点才能实现在引擎启动前修改和注入Mod的工作

因为关系较为复杂，这里使用了GithubAction来实现自动编译

预编译版的[修改版的SC2引擎](https://github.com/Lyoko-Jeremie/sugarcube-2_Vrelnir/actions) 其中注入了ModLoader的引导点   
预编译好的[ModLoader以及Mod打包器（packModZip.js）和注入器（insert2html.js）和几个Addon](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/actions)   
自动打包的[包含ModLoader和Addon的原版DoL游戏](https://github.com/Lyoko-Jeremie/DoLModLoaderBuild/actions)   


##### 打包后的结构

```
((定制sc2引擎 + 原版游戏) + ModLoader)
```

因为ModLoader需要在sc2引擎启动之前把事情全部做完，但是引擎的启动事件是挂在jq的页面onLoaded事件上的，这个没法正常推迟，
所以最直接的解决办法就是把sc2引擎的启动代码单独放到一个函数里面，然后让ModLoader在jq的事件里面先启动，等启动完再调用原来的启动sc2引擎的代码

使得本来是 `jq → sc2` 的过程，变成 `jq → ModLoader → SC2`



##### 如果需要手动打包，需要按照下面的步骤进行

1. 构建 `修改版的SC2引擎` 获得 format.js ，
2. 覆盖到游戏项目的 devTools\tweego\storyFormats\sugarcube-2\format.js ，再编译游戏就可以生成带修改版的SC2引擎的游戏
3. 用ModLoader的注入器(insert2html.js)将ModLoader注入到游戏的html里。

以上的第三步在注入时会将 `modList.json` 中列出的Mod作为【Local】类型的Mod作为预置Mod一起注入到html中，默认情况下 `modList.json` 中会包含ModLoaderGui和一些Addon

### 有关Addon

由于将所有功能都实现在ModLoader中既不现实也不合理，特别是，有关特定游戏的功能更不应该实现在与SC2引擎绑定的ModLoader中，故ModLoader提供了Addon的功能。

Addon是一种特殊的Mod，作为一种功能扩展的形式存在，通过将常用功能集中在一个Mod中供其他ModLoader调用，这样的Mod就可以成为Addon。

例如在RimWorld中的 `身体扩展`、`战斗扩展`、`发饰扩展` 等等，这些Mod作为一种中间层，通过直接注入和修改游戏并扩展出新功能来供其他Mod调用，以此来方便其他mod的编写。

例如项目中的 [ImageLoaderHook](mod、ImageLoaderHook) 就是一个Addon，
这个Mod通过挂钩DoL游戏中的[图片加载器](Renderer.ImageLoader)，实现了把Mod中的图片加载到游戏中的功能，游戏在加载图片时就会去读取Mod中的图片。

项目中的 [CheckDoLCompressorDictionaries](mod/CheckDoLCompressorDictionaries) 是另一个不同功能的Addon，
这个Mod仅仅检查DoLCompressorDictionaries数据结构，并在发现数据结构变化后发出警示，来提示Mod开发者和使用者避免修改DoLCompressorDictionaries，以避免影响存档有效性。

项目中的 [ReplacePatch](mod/ReplacePatch) 和 [TweeReplacer](mod/TweeReplacer) 则实现Passage和JS/CSS的字符串替换功能，
大部分需要修改游戏逻辑的Mod就不需要自己编写修改的代码，可以直接使用这两个Mod来实现字符串替换功能，
将这个功能独立出来，避免ModLoader过于臃肿的同时，也方便了对替换功能的快速更新和升级，在必要时Mod作者可以自行folk来实现更复杂的替换功能而不需要修改ModLoader的代码。



---

## 加密 Mod

为了满足部分Mod作者对内容保护的要求，设计了基于 libsodium 的 Mod 内容保护框架

v2.1.0 开始对加密 Mod 提供正式支持。有关加密 Mod 如何工作以及如何设计一个加密 Mod ，请参见样例 [CryptoI18nMod](https://github.com/Lyoko-Jeremie/CryptoI18nMod)

---

## 如何不重新编译直接替换编译后游戏的SC2引擎

How to replace the SC2 engine of a compiled game without recompiling

以 `node sc2ReplaceTool.js  "<编译后的游戏html>" "<新的SC2引擎format.js文件路径>"` 的方式可以使用sc2ReplaceTool将已编译的新SC2引擎替换到编译后的游戏html中，这样可以避免重新编译整个游戏  
编译后的html文件名将被添加 `.sc2replace.html` 的后缀，可以再按照上面的方法使用`insert2html`来将ModLoader注入到替换后的游戏html中

You can use sc2ReplaceTool to replace the compiled new SC2 engine into the compiled game's HTML by using `node sc2ReplaceTool.js "<compiled game's HTML>" "<path to the new SC2 engine 'format.js' file>"`, this way you can avoid recompiling the entire game.  
The compiled HTML filename will be appended with the suffix `.sc2replace.html`, and you can then use the `insert2html` method mentioned above to inject the ModLoader into the replaced game HTML.


格式 format ：

```shell
node "<sc2ReplaceTool.js 文件路径>" "<编译后的游戏html>" "<新的SC2引擎format.js文件路径>"
```

例子 example :

```shell
node "H:\Code\sugarcube-2\ModLoader\dist-insertTools\sc2ReplaceTool.js" "H:\Code\degrees-of-lewdity\Degrees of Lewdity VERSION.html" "h:\Code\DoL\sugarcube-2\build\twine2\sugarcube-2\format.js"
```

会在原始html文件同目录下生成一个同名的html.sc2replace.html文件，例如：  
A new file with the name `html.sc2replace.html` will be generated in the same directory as the original HTML file. For example:
```
Degrees of Lewdity VERSION.html.sc2replace.html
```


之后使用 `insert2html` 将ModLoader注入到替换后的游戏html中  
Afterwards, use `insert2html` to inject the ModLoader into the HTML of the game that has been replaced with the new SC2 engine.

切换到 modList.json 所在文件夹  
Switch to the directory where `modList.json` is located.

```shell
cd ./src/insertTools/modList.json
```

运行 (run command)：

```shell
node "<insert2html.js 文件路径>" "<Degrees of Lewdity VERSION.html 文件路径>" "<modList.json 文件>" "<BeforeSC2.js 文件路径>"
```

例如 example：

```shell
node "H:\Code\sugarcube-2\ModLoader\dist-insertTools\insert2html.js" "H:\Code\degrees-of-lewdity\Degrees of Lewdity VERSION.html.sc2replace.html" "modList.json" "H:\Code\sugarcube-2\ModLoader\dist-BeforeSC2\BeforeSC2.js"
```

会在原始html文件同目录下生成一个同名的html.mod.html文件，例如：  
A new file with the name `html.mod.html` will be generated in the same directory as the original HTML file. For example:
```
Degrees of Lewdity VERSION.html.sc2replace.html.mod.html
```
打开`Degrees of Lewdity VERSION.html.sc2replace.html.mod.html`文件， play   
open file and play it.



---

## TODO

- [x] 安全模式 Safe Mode   
- [ ] Mod排序(ModLoaderGUI) Mod sorting
- [ ] Mod禁用启用(可选加载)  
- [ ] 游戏内Mod设置界面  
- [x] 修改其他Mod(Mod i18n pack(eg. english a cn mod))  Modify other mods   
- [ ] 在线编辑passage   
- [ ] 查看Diff   
- [x] Mod-游戏版本兼容性检查   
- [ ] 使用Wikify执行script来注入游戏上下文，注入和拦截js函数和对象   
- [x] 提供Passage Prefix/Postfix Addon来实现前后缀模式(可以使用注入script函数并添加一行前后缀标签的方式实现)   
- [x] 提供PostPassage Addon来访问输出后的html node   
- [x] Mod Zip 加密 ( libsodium + 安全模式 + Mod禁用启用 )   
- [ ] 在存档中保存Mod相关数据，用以检查存档兼容性 ( 类似RimWorld的存档检查功能，对修改涉及存档兼容性的Addon添加存档兼容性检查 )   
- [x] i18n version `tweeFileList`  

### addon mod

- [x] ModLoaderGui       Mod管理器
- [x] ImageLoaderHook       图片加载器，负责拦截DoL的图像加载请求并将mod提供的图片注入到游戏
- [x] CheckDoLCompressorDictionaries       检查DoLCompressorDictionaries数据结构，发现变化时发出警告，提示mod作者可能造成了存档不兼容
- [x] CheckGameVersion       提供mod检查游戏版本的功能
- [x] ConflictChecker        提供mod检查冲突的功能，给mod作者提供额外的mod间的先序和后序依赖检查
- [x] ReplacePatch           提供passage和js/css的字符串替换功能
- [x] TweeReplacer           提供passage的字符串替换功能，支持复杂的正则替换和大分段替换
- [x] Diff3WayMerge          以在线三方合并计算的方式提供passage的合并功能，避免手动填写搜索字符串。此addon尚不稳定不稳定
- [x] ModdedClothesAddon     提供快速添加衣服的addon，可以简单地添加衣服，不需要编写js代码
- [x] ModdedFeatsAddon       提供快速添加成就的addon，可以简单地添加成就，不需要编写js代码
- [ ] ModdedNpcAddon         提供快速添加NPC的addon，可以简单地添加NPC，不需要编写js代码  【正在收集方案阶段】
