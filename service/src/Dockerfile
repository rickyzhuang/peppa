FROM openjdk:7u121-jre

ENV PROJECT_NAME im-service
ENV DEPLOY_DIR /data/service
ENV VM_OPTION "-XX:MaxPermSize=128m -Xms128m -Xmx512m"

RUN mkdir -p ${DEPLOY_DIR}
COPY ./target/${PROJECT_NAME}.jar ${DEPLOY_DIR}/${PROJECT_NAME}.jar
ENTRYPOINT java -jar ${VM_OPTION}  -XX:OnOutOfMemoryError="kill -9 %p" ${DEPLOY_DIR}/${PROJECT_NAME}.jar