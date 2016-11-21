FROM storjlabs/interpreter:latest
RUN apt-get update && apt-get install -y telnet vim net-tools
RUN mkdir /worker
WORKDIR /worker
#ADD ./package.json /worker/package.json
ADD ./ /worker/
RUN npm install
CMD /worker/bin/worker.js
