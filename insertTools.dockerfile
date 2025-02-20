FROM node:lts
COPY dist/ /tools
VOLUME [ "/src" ]
WORKDIR /src
CMD [ "node", "/tools/packModZip.js", "/src/boot.json" ]
