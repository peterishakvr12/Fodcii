# docker/judge-worker/Dockerfile
# Containerised judge worker — runs the BullMQ-based standalone worker.
#
# This image is the worker node in the distributed judge cluster.
# It connects to Redis and processes submissions from the queue.
#
# Build:  docker build -t fodci/judge-worker -f docker/judge-worker/Dockerfile .
# Run:
#   docker run --rm \
#     -e DATABASE_URL=postgresql://... \
#     -e REDIS_URL=redis://redis:6379 \
#     -e WORKER_CONCURRENCY=4 \
#     fodci/judge-worker
FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      tini g++ python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (layer caching)
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile --filter @workspace/api-server

# Copy compiled sources
COPY artifacts/api-server/dist ./artifacts/api-server/dist
COPY lib ./lib

RUN useradd -r -s /usr/sbin/nologin judger
USER judger

ENV NODE_ENV=production \
    WORKER_CONCURRENCY=4

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "artifacts/api-server/dist/bullmq-worker.mjs"]
