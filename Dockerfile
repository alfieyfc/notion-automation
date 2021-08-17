FROM node:lts as builder
RUN mkdir -p /myapp/local/ && cd /myapp/
WORKDIR /myapp/
COPY package.json /myapp/package.json
RUN npm install

FROM node:lts-alpine
WORKDIR /myapp/
COPY --from=builder /myapp/node_modules/ /myapp/node_modules/
COPY index.js /myapp/index.js
CMD ["node index.js"]




