# docker/base-runner/Dockerfile
# Minimal base image for all language runners.
# Production: each language runner extends this.
FROM debian:12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      tini \
      coreutils \
    && rm -rf /var/lib/apt/lists/*

# Non-root judge user — no shell, no home, no privilege
RUN useradd -r -s /usr/sbin/nologin -d /tmp judger

WORKDIR /sandbox
RUN chown judger:judger /sandbox

# Tini is PID 1 — handles signal forwarding and zombie reaping
ENTRYPOINT ["/usr/bin/tini", "--"]
