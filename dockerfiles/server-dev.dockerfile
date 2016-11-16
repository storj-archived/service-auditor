FROM storjlabs/interpreter:latest
RUN mkdir /audits-server
WORKDIR /audits-server
ADD ./package.json /audits-server/package.json
RUN npm install
RUN npm install -g nodemon
CMD nodemon /audits-server/bin/audits-server.js
