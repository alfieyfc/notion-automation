
FROM node:lts-alpine
RUN apk add tzdata
RUN mkdir -p /myapp/local/ && cd /myapp/
WORKDIR /myapp/
COPY package.json /myapp/package.json
COPY package-lock.json /myapp/package-lock.json
RUN npm install

COPY index.js /myapp/index.js
COPY tools/ /myapp/tools/
CMD ["node", "index.js"]




