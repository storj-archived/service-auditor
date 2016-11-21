FROM storjlabs/interpreter:latest
RUN apt-get update && apt-get install -y telnet vim net-tools
RUN mkdir /polling
WORKDIR /polling
#ADD ./package.json /polling/package.json
ADD ./ /polling/
RUN npm install
CMD /polling/bin/polling.js
