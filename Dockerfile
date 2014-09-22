# meteor-website application
FROM dockerfile/nodejs
MAINTAINER Paolo Scanferla <paolo.scanferla@mondora.com>
WORKDIR /
RUN curl https://install.meteor.com/ | sh
RUN mkdir /meteor-website
ADD ./ /meteor-website/
RUN cd /meteor-website && meteor bundle /bundle.tgz
RUN tar xvzf /bundle.tgz
RUN cd /bundle/programs/server && npm install
ENTRYPOINT ["node", "/bundle/main.js"]
