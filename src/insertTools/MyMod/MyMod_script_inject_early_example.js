console.log('MyMod_script_inject_early_example.js', ' ', ' 这个文件会被插入到SC2数据节点之前，在dom的script标签中执行 ');
console.log('MyMod_script_inject_early_example.js', ' ', ' 会在MyMod_script_earlyload_example.js前执行，可以用来注入earlyload的依赖项脚本 ');
console.log('MyMod_script_inject_early_example.js', ' ', ' 这个脚本中的同步指令一定会在加载下一个脚本以及earlyload之前由dom的script同步执行机制执行。 ');
console.log('MyMod_script_inject_early_example.js', ' ', ' 这个脚本中的异步指令的执行时机无法被保证，最早可能的执行时间可能是在第一个earlyload脚本的同步部分全部执行完毕之后执行。 ');
console.log('MyMod_script_inject_early_example.js', ' ', ' inject_early和earlyload的同步/异步执行关系：' +
    ' inject_early同步 -> 第一个earlyload同步 -> inject_early本体发出的第一层异步 -> 后续的其他的同步/异步执行关系无法预测 ');

(new Promise((resolve, reject) => {
    console.log('MyMod_script_inject_early_example.js', ' ', ' Promise run ');
    resolve();
})).then(() => {
    console.log('MyMod_script_inject_early_example.js', ' ', ' Promise then 1 ');
}).then(() => {
    console.log('MyMod_script_inject_early_example.js', ' ', ' Promise then 2 ');
}).catch((err) => {
    console.error(err);
});
