(async () => {


  const modUtils = window.modUtils;
  const modSC2DataManager = window.modSC2DataManager;
  const logger = modUtils.getLogger();

  const zips = modSC2DataManager.getModLoader().getModZip('MyMod');
  if (zips && zips.length > 0) {
    // 可以在这里读取当前mod的zip压缩包中的资源

    let selfZip;
    for (let i = 0; i < zips.length; i++) {
      const zip = zips[i];
      const info = zip.getModInfo();
      if (/* 做一些搜索 */ true) {
        selfZip = zip;
        break;
      }
    }
    if (selfZip) {
      const innerMod = await selfZip.getZipFile().file('MyMod2.mod.zip')?.async('uint8array').catch((err) => {
        console.error(err);
        return undefined;
      });
      console.log('innerMod', innerMod);
      // const bb = new Blob([innerMod]);
      // window.modLoaderGui.debugExport.createDownload(bb, 'MyMod--1.mod.zip');
      const isLoaded = await modUtils.lazyRegisterNewModZipData(innerMod, /*{base64: true}*/);
      console.log('MyMod_script_test_mod_in_mod.js', '  ', ' 成功加载 MyMod.mod.zip ', [isLoaded]);
      logger.log('MyMod_script_test_mod_in_mod.js  成功加载 MyMod.mod.zip ');
    }
  }

})();
