FROM storjlabs/storj:base
RUN mkdir /server
WORKDIR /server
ADD ./package.json /server/package.json
RUN npm install
CMD /server/bin/server.js
