(() => {
    // 文件必须以 `(() => {` 在第一行第一个字符开头，以 `})();` 结尾，其他所有代码都必须在这个自调用函数中
    // 文件的开头会有一个等价的`return`，这个return会由JsPreloader在调用时插入到这个文件的开头
    // 这样才能确保这个文件的返回值会被JsPreloader正确接收

    console.log('MyMod_script_preload_example3.js', '  ', '可以在preload文件中执行异步指令，只需确保异步的Promise最终被返回到调用者，' +
        '即可让JsPreloader等待当前脚本的异步任务执行结束后再执行下一个脚本或继续初始化引擎 ');
    return Promise.resolve("xxxxx");
})();
