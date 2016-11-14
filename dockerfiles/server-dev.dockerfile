FROM storjlabs/storj:base
RUN mkdir /server
WORKDIR /server
ADD ./package.json /server/package.json
RUN npm install
RUN npm install -g nodemon
CMD nodemon /server/bin/server.js
