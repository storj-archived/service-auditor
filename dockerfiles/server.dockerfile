FROM storjlabs/storj:base
RUN mkdir /audits-server
WORKDIR /audits-server
ADD ./package.json /audits-server/package.json
RUN npm install
CMD /server/bin/audits-server.js
