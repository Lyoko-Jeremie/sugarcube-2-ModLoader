(async () => {

    // this example not work

    const R = await fetch(
        // 'http://api.ipify.org?format=json',
        'http://t.cn',
        // 'https://raw.githubusercontent.com/wiki/Lyoko-Jeremie/sugarcube-2-ModLoaderGui/how-to-load-mod.png',
        {
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
        });
    const T = await R.text();
    console.log('MyMod_script_preload_example_remote.js R T ', T);

})();
