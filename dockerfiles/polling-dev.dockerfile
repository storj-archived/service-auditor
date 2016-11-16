FROM storjlabs/interpreter:latest
RUN mkdir /polling
WORKDIR /polling
ADD ./package.json /polling/package.json
RUN npm install
RUN npm install -g nodemon
CMD nodemon /polling/bin/polling.js
