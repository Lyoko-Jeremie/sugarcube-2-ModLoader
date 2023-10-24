(async () => {


  const modUtils = window.modUtils;
  const modSC2DataManager = window.modSC2DataManager;
  const logger = modUtils.getLogger();

  const selfZip = modSC2DataManager.getModLoader().getModZip('MyMod');
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

})();
