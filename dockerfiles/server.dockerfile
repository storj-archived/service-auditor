FROM storjlabs/interpreter:latest
RUN mkdir /audits-server
WORKDIR /audits-server
#ADD ./package.json /audits-server/package.json
ADD . /audits-server/
RUN npm install
#CMD [ "/bin/sleep", "5800" ]
CMD /audits-server/bin/audits-server.js
