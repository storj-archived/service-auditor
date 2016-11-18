FROM storjlabs/interpreter:latest
RUN mkdir /polling
WORKDIR /polling
#ADD ./package.json /polling/package.json
ADD ./ /polling/
RUN npm install
CMD /polling/bin/polling.js
