
编译脚本

```shell
yarn run webpack:BeforeSC2:w
yarn run ts:ForSC2:w
yarn run webpack:insertTools:w
```

如何插入Mod加载器以及内嵌到html文件：

编写 modList.json 文件，格式如下：
（样本可参见 src/insertTools/modList.json ）
```json
[
  'mod1.zip',
  'mod2.zip'
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
打开`Degrees of Lewdity VERSION.html.i18n.html`文件， play

----------------

如何制作 Mod.zip 文件：


给自己的mod命名

以mod名字组织自己的mod

编写mod的引导描述文件 boot.json 文件

格式如下（样例 src/insertTools/MyMod/boot.json）：

```json
{
  "name": "MyMod",    // mod名字
  "version": "1.0.0", // mod版本
  "styleFileList": [      // css 样式文件
    "MyMod_style_1.css",
    "MyMod_style_2.css"
  ],
  "scriptFileList_perload": [   // 预加载的 js 脚本文件 ， 会在引擎初始化前启动， 可以在此处动态修改Passage的内容
    "MyMod_script_preload_example.js"
  ],
  "scriptFileList": [     // js 脚本文件
    "MyMod_script_1.js",
    "MyMod_script_2.js"
  ],
  "tweeFileList": [       // twee 剧本文件
    "MyMod_Passage1.twee",
    "MyMod_Passage2.twee"
  ],
  "imgFileList": [        // 图片文件，尽可能不要用容易与文件中其他字符串混淆的文件路径，否则会意外破坏文件内容
    "MyMod_Image/typeAImage/111.jpg",
    "MyMod_Image/typeAImage/222.png",
    "MyMod_Image/typeAImage/333.gif",
    "MyMod_Image/typeBImage/111.jpg",
    "MyMod_Image/typeBImage/222.png",
    "MyMod_Image/typeBImage/333.gif"
  ],
  "imgFileReplaceList": [   //  图片文件覆盖列表，指定应覆盖的图片文件，格式为 [ [ "原图片文件路径", "覆盖图片文件路径" ], ... ]
    [
      "img/A/base.jpg",
      "MyMod_Image/typeAImage/111.jpg"
    ],
    [
      "img/B/base.png",
      "MyMod_Image/typeAImage/222.png"
    ],
    [
      "img/body/base.gif",
      "MyMod_Image/typeAImage/333.gif"
    ]
  ],
  "addstionFile": [     // 附加文件列表，额外打包到zip中的文件，此列表中的文件不会被加载，仅作为附加文件存在
    "readme.txt"
  ]
}

```



打包：

切换到 Mod 所在文件夹
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

注意：
1. boot.json 文件内的路径都是相对路径，相对于zip文件根目录的路径，且在打包时也要相对于执行目录的路径。
2. 图片文件的路径是相对于zip文件根目录的路径，但在打包时要相对于执行目录的路径。
3. 图片会在mod读取时将所有使用图片（路径）的位置替换为图片的 base64url 。
4. 若文件中出现了与图片路径极其相似的字符串，该字符串也会被替换为图片的 base64url ，请注意。
5. 同一个mod内的文件名不能重复，也尽量不要和原游戏或其他mod重复。与原游戏重复的部分会覆盖游戏源文件。（图片不受此规则影响）。
7. 具体的来说，mod会按照mod列表中的顺序加载，靠后的mod会覆盖靠前的mod的passage同名文件，mod之间的同名css/js文件会直接将内容concat到一起，故不会覆盖css/js/img等同名文件。
8. 加载时首先计算mod之间的覆盖，然后将计算结果覆盖到原游戏中
9. 当前版本的mod加载器的工作方式是直接将css/js/twee文件按照原版sc2的格式到html文件中。
10. ~mod中的twee文件与正常的twee文件不同的是，这里每一个twee文件中有且只能有一个passage，且文件名需要和文件内的passage同名，否则会无法正确加载。~ 此缺陷已解决，现在可以以原版同样的方式工作
11. 使用imgFileReplaceList时请小心谨慎。




