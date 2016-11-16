FROM storjlabs/interpreter:latest
RUN mkdir /audits-server
WORKDIR /audits-server
ADD ./package.json /audits-server/package.json
RUN npm install
CMD /audits-server/bin/audits-server.js
