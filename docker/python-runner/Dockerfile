# docker/python-runner/Dockerfile
# Secure Python 3.11 execution environment.
#
# Build:  docker build -t fodci/python-runner -f docker/python-runner/Dockerfile .
# Run:
#   docker run --rm \
#     --network none          \   # no network access
#     --memory 256m           \   # hard memory cap
#     --cpus 0.5              \   # CPU throttle
#     --read-only             \   # immutable root FS
#     --tmpfs /tmp:size=32m   \   # writable scratch space only
#     --security-opt no-new-privileges \
#     --user judger           \
#     -i fodci/python-runner python3 /dev/stdin < solution.py
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

# Strip pip, wheel, and setuptools — submission code must not install packages
RUN pip uninstall -y pip setuptools wheel 2>/dev/null || true

RUN useradd -r -s /usr/sbin/nologin -d /tmp judger

WORKDIR /sandbox
RUN chown judger:judger /sandbox

USER judger

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["python3"]
