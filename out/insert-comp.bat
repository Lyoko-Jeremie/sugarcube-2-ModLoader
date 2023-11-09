
cd /d %~dp0

node "dist-insertTools\insert2html-polyfill.js" %1 "modList.json" "dist-BeforeSC2-comp\BeforeSC2.js" "dist-BeforeSC2-comp\polyfillWebpack.js"

pause
