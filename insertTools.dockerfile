FROM node:lts
COPY ./dist-insertTools /tools
VOLUME [ "/src" ]
WORKDIR /src
CMD [ "node", "/tools/packModZip.js", "/src/boot.json" ]
