// 因为文件的开头会有一个等价的`return`，这个return会由JsPreloader在调用时插入到这个文件的开头
// 所以这个文件下面的内容不会被执行，这是个无效的文件，会在控制台得到一个 "unreachable code after return statement" 的警告
;(() => {
    console.log('MyMod_script_preload_example2.js', '  ', '');
})();
