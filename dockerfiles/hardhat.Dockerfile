FROM node:lts

RUN npm i -g pnpm

WORKDIR /etc

RUN git clone -b web-dev https://github.com/ntut-xuan/BeiKeBox-Solidity.git

WORKDIR /etc/BeiKeBox-Solidity

RUN pnpm i
RUN npx hardhat compile
CMD pnpm start:local-node