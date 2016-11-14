FROM storjlabs/storj:base
RUN mkdir /worker
WORKDIR /worker
ADD ./package.json /worker/package.json
RUN npm install
CMD /worker/bin/worker.js
