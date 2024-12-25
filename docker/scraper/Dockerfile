FROM node:22.12-alpine

USER node
WORKDIR /usr/src/app

COPY --chown=node:node ./packages/scraper/package.json .
COPY --chown=node:node ./packages/scraper/package-lock.json .
RUN npm install

COPY --chown=node:node ./packages/scraper .
COPY --chown=node:node .env .

CMD ["npm", "run", "scraper:start"]


