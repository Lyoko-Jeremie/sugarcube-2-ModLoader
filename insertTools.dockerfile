FROM node:lts
COPY sugarcube-2-ModLoader/dist-insertTools /tools
VOLUME [ "/src" ]
WORKDIR /src
CMD [ "node", "/tools/packModZip.js", "/src/boot.json" ]
