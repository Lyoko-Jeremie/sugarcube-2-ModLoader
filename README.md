

```shell
yarn run webpack:BeforeSC2:w
yarn run ts:ForSC2:w
yarn run webpack:insertTools:w
```

```shell
node .\dist-insertTools\insert2html.js "<Degrees of Lewdity VERSION.html 文件路径>" "<modList.json 文件路径>" "<BeforeSC2.js 文件路径>"
```

例如：

```shell
node .\dist-insertTools\insert2html.js "H:\Code\degrees-of-lewdity\Degrees of Lewdity VERSION.html" "src/insertTools/modList.json" "H:\Code\sugarcube-2\ModLoader\dist-BeforeSC2\BeforeSC2.js"
```

```
Degrees of Lewdity VERSION.html.mod.html
```

----------------

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

注意：
1. boot.json 文件内的路径都是相对路径，相对于zip文件根目录的路径，且在打包时也要相对于执行目录的路径

