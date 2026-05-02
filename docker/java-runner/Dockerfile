# docker/java-runner/Dockerfile
# Secure Java 21 (OpenJDK) compilation and execution environment.
#
# Build:  docker build -t fodci/java-runner -f docker/java-runner/Dockerfile .
# Usage (two-step):
#   # Compile
#   docker run --rm --network none --memory 512m --cpus 1 \
#     --read-only --tmpfs /tmp:size=64m \
#     --security-opt no-new-privileges \
#     -v $(pwd):/code:ro fodci/java-runner javac /code/Solution.java -d /tmp
#   # Execute
#   docker run --rm --network none --memory 256m --cpus 0.5 \
#     --read-only --tmpfs /tmp:size=32m \
#     --security-opt no-new-privileges --user judger \
#     fodci/java-runner java -Xmx200m -Xss8m -cp /tmp Solution
FROM eclipse-temurin:21-jdk-alpine

RUN apk add --no-cache tini

RUN adduser -S -s /sbin/nologin judger

WORKDIR /sandbox
RUN chown judger:judger /sandbox

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["java"]
