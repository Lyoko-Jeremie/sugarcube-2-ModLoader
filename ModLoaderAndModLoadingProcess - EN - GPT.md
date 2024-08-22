ModLoader Operation Principles and Mod Loading Process


# **!!! This File Translate from Chinese to English by GPT-4, So it may have some mistakes. !!!**


# 1. Premise
SugarCube2 is a fully synchronous rendering engine that dynamically translates (assembles) game scripts (such as twee) into HTML in a completely synchronous manner (without any asynchronous operations) and displays them.

The game scripts (twee, JS, css) are embedded in the compiled webpage HTML (tw-storydata node) as text.

To modify the game, we have several methods:
1. Modify the game scripts in the tw-storydata node of the webpage HTML before SugarCube2 compiles the game scripts into HTML, making SugarCube2 believe that our game was originally like this.
2. Participate in the compilation process while SugarCube2 is translating the game scripts, dynamically changing the input and output of the compilation.
3. After SugarCube2 compiles the game into HTML and displays it on the webpage, directly modify the displayed webpage content, making users feel that the game was originally like this.

For the above three methods, there are three corresponding implementations:
1. To be compatible with the past method of directly modifying HTML to create mods, ModLoader modifies the game scripts in the tw-storydata node of the webpage HTML, making the script data format in memory exactly the same as after directly modifying the webpage. This function is exported to mod authors in the form of two addon mods, [TweeReplacer]() and [ReplacePatch](), and their corresponding derivative addon mods from ModLoader.
2. By making some invasive modifications to SugarCube2's Wikifier, ModLoader achieves reading, hooking, and intercepting the input and output of the compilation engine, providing the possibility to dynamically change the input and output of the compilation. This function is exported to mod authors in the form of the addon mod [TweePrefixPostfixAddonMod]().
3. Since SugarCube2 comes with JQuery event messages for rendering completion, by listening to SugarCube2's passage rendering completion messages, we can accurately know the time point when SugarCube2's rendering is completed, and then we can modify the HTML content immediately after the passage is displayed by listening to this message. For this, emicoto implemented a tool called [Simple Framework](https://github.com/emicoto/DOLMods) to bypass the complex and chaotic architecture of DoL itself and directly insert display content into HTML.

---

Focusing on the operation principles and mod loading process of ModLoader, the following introduction mainly involves Method 1 and its related content.

# 2. ModLoader Operation Principles and Mod Loading Process

## 2.1 How ModLoader Boots

Since SugarCube2 is a fully synchronous rendering engine, to modify the game scripts in the tw-storydata node of the webpage before SugarCube2 starts, we need to execute all the pre-game loading tasks of ModLoader before it starts.

After carefully reading the source code of SugarCube2, we can find that the startup code of SugarCube2 is located in a `jQuery(() => {})` closure function in `sugarcube.js#L111`, which starts after the webpage is loaded. This means that if we can make some modifications in this closure and insert our startup script, then we can let ModLoader start before SugarCube2 starts.
Considering the design requirements of ModLoader, we find that ModLoader needs to perform a large number of asynchronous operations, including loading mods from remote, reading mod zip files from localStorage/indexDB, reading mod information from zip files, etc.
Therefore, we need to insert a Promise before the startup code of SugarCube2 that allows us to execute asynchronous code. After reviewing the source code of SugarCube2 and jQuery, we find that the only and most reliable method is to add a Promise and wrap the original startup code of SugarCube2, so that the startup code of SugarCube2 can wait for our asynchronous operations to complete.

## 2.2 How ModLoader Initializes and Starts

We execute Modloader's [startInit()](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/blob/ac0bb6c59abd93a2a784f2a574f031861bcf269f/src/BeforeSC2/SC2DataManager.ts#L247) function before SugarCube2 starts and begin initializing ModLoader.

First, we save all the content in the tw-storydata node of the original unmodified webpage HTML. [initSC2DataInfoCache()](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/blob/ac0bb6c59abd93a2a784f2a574f031861bcf269f/src/BeforeSC2/SC2DataManager.ts#L259)

Since startInit() is a member function of SC2DataManager, this means that all internal objects and functional plugins in SC2DataManager will be initialized at the same time. [Link](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/blob/ac0bb6c59abd93a2a784f2a574f031861bcf269f/src/BeforeSC2/SC2DataManager.ts#L25)
This includes all functions implemented by ModLoader and made available to advanced mod authors.

After completing the above initialization process, the most important mod loading process begins.

### 2.3 Mod Loading Process and ModLoader Startup Process

The mod loading process is initiated by calling [ModLoader.loadMod()](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/blob/ac0bb6c59abd93a2a784f2a574f031861bcf269f/src/BeforeSC2/ModLoader.ts#L307) from `startInit()`.

The overall steps involved in mod loading are as follows:
1. Read the mod's zip file from a source.
2. Execute `scriptFileList_inject_early` and `scriptFileList_earlyload` while also performing complex loading trigger logic.
3. Register the mod with Addon.
4. Rebuild the `tw-storydata` node.
5. Execute `scriptFileList_preload`.
6. Start the normal execution process of SugarCube2.

The detailed process is as follows:
1. Mods are loaded in the order of embedded HTML, remote servers, LocalStorage, and IndexDB. Dependency checks are performed using `DependenceChecker.checkFor()`.
2. The `boot.json` file within the mod is read using [ModZipReader](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/blob/ac0bb6c59abd93a2a784f2a574f031861bcf269f/src/BeforeSC2/ModZipReader.ts#L50) to understand the subsequent actions for the mod.
3. All JavaScript files listed in `scriptFileList_inject_early` are directly injected into the HTML by calling [initModInjectEarlyLoadInDomScript()](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/blob/ac0bb6c59abd93a2a784f2a574f031861bcf269f/src/BeforeSC2/ModLoader.ts#L465). Mods should complete their initialization here, but only synchronous operations are allowed.
4. Hooks such as `AddonPluginHookPoint.afterInjectEarlyLoad`, `ModLoadControllerCallback.afterModLoad`, and `AddonPluginHookPoint.afterModLoad` are triggered to notify all mods that the current mod has been loaded. This is where mods requiring very early execution can operate, and the hook calls will wait for any asynchronous operations to complete.
5. [initModEarlyLoadScript()](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/blob/ac0bb6c59abd93a2a784f2a574f031861bcf269f/src/BeforeSC2/ModLoader.ts#L517) is called to execute all single-line commands in `scriptFileList_earlyload`. This uses [JsPreloader.JsRunner()](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/blob/ac0bb6c59abd93a2a784f2a574f031861bcf269f/src/BeforeSC2/JsPreloader.ts#L117), which wraps the original JavaScript code in a function and waits for any asynchronous calls to finish. It is particularly important to note that the executor used here is [JsPreloader.JsRunner()](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/blob/ac0bb6c59abd93a2a784f2a574f031861bcf269f/src/BeforeSC2/JsPreloader.ts#L117). The real implementation of this executor involves wrapping the code from the original JS file into a function that looks like `(async () => {return ${jsCode}\n})()` and waits for the asynchronous call returned by the function to finish. This code, by adding a `return` instruction at the beginning of the entire file's first line, will, according to the semantics of JS's `return`, only execute the code on the first line of the JS file, or a closure function starting from the first line.
6. During `initModEarlyLoadScript()`, [tryInitWaitingLazyLoadMod()]() is continuously called to check for mods that have added lazy-load mods and to load these mods. Encrypted mods use the lazy-load feature to decrypt and release the loaded mods at this stage.
7. Lazy-load mods, which are only read from the zip file at this point, have their `scriptFileList_inject_early` and `scriptFileList_earlyload` executed simultaneously [here](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/blob/ac0bb6c59abd93a2a784f2a574f031861bcf269f/src/BeforeSC2/ModLoader.ts#L745), with continuous triggering of the `canLoadThisMod` hook.
8. After loading and executing the mod's JavaScript scripts, the `AddonPluginHookPoint.afterEarlyLoad` hook is triggered.
9. [registerMod2Addon()](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/blob/ac0bb6c59abd93a2a784f2a574f031861bcf269f/src/BeforeSC2/ModLoader.ts#L384) is called to register all mods declared in `boot.json` with `addonPlugin` to their corresponding Addon Mods.
10. At this point, Addon Mods receive the mod registration callback from `AddonPluginHookPointExMustImplement.registerMod`, allowing them to record or perform actions based on their design.
11. The `AddonPluginHookPoint.afterRegisterMod2Addon` hook is triggered. allowing mods to modify the merged game script data. Mods like `TweeReplacer` and `ReplacePatch` perform their replacement calculations here.
12. This completes the loading of the mod's JavaScript functionalities.
13. The `AddonPluginHookPoint.beforePatchModToGame` hook is triggered.
14. The `styleFileList`, `scriptFileList`, and `tweeFileList` data are merged into the `tw-storydata` node, rebuilding it.
15. The `AddonPluginHookPoint.afterPatchModToGame` hook is triggered.
16. The `ModLoader.loadMod()` process ends, returning control to SugarCube2's code.
17. SugarCube2's code then calls [JsPreloader.startLoad()](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader/blob/ac0bb6c59abd93a2a784f2a574f031861bcf269f/src/BeforeSC2/JsPreloader.ts#L51).
18. Files in `scriptFileList_preload` are executed
19. The `AddonPluginHookPoint.afterPreload` hook is triggered.
20. The `ModLoadControllerCallback.ModLoaderLoadEnd` callback is triggered, marking the last hook event in the ModLoader loading process. Mods can complete their final tasks before SugarCube2 starts here.
21. The mod loading is complete, ModLoader has started, and the normal operation of SugarCube2 begins. From this point, all actions of ModLoader are triggered by SugarCube2.


### 3. ModLoader Customized Version of SugarCube2 Modifications to the Original Version (DoL Version)

1. Modified the SugarCube2 startup point.
2. For the Wikifier, added `_lastPassageQ` and corresponding data and operations to track the entire script compilation process. The purpose is to track and modify various compilation levels. This change involves all areas that touch compilation, mainly including `macrolib.js`, `parserlib.js`, and `wikifier.js`. You can search using `passageObj` as the keyword.
3. Intercepted img tags and svg tags to achieve the purpose of loading all images from memory without a server.

