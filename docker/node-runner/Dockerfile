# docker/node-runner/Dockerfile
# Secure Node.js (v22 LTS) execution environment.
#
# Build:  docker build -t fodci/node-runner -f docker/node-runner/Dockerfile .
# Run:
#   docker run --rm \
#     --network none --memory 256m --cpus 0.5 \
#     --read-only --tmpfs /tmp:size=32m \
#     --security-opt no-new-privileges --user judger \
#     -i fodci/node-runner node --max-old-space-size=128 /dev/stdin < solution.js
FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

# Remove npm/npx — submission code must not install packages
RUN rm -rf /usr/local/lib/node_modules/npm && \
    rm -f /usr/local/bin/npm /usr/local/bin/npx

RUN useradd -r -s /usr/sbin/nologin -d /tmp judger

WORKDIR /sandbox
RUN chown judger:judger /sandbox

USER judger

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node"]
