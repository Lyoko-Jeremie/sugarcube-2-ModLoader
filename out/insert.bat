
cd /d %~dp0

node "dist-insertTools\insert2html.js" %1 "modList.json" "dist-BeforeSC2\BeforeSC2.js"

pause
