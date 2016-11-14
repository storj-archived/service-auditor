FROM storjlabs/storj:base
RUN mkdir /worker
WORKDIR /worker
ADD ./package.json /worker/package.json
RUN npm install
RUN npm install -g nodemon
CMD nodemon /worker/bin/worker.js
