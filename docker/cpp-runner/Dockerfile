# docker/cpp-runner/Dockerfile
# Secure C++ (g++ 14 / C++17) compilation and execution environment.
#
# Build:  docker build -t fodci/cpp-runner -f docker/cpp-runner/Dockerfile .
# Usage (two-step):
#   # Compile
#   docker run --rm --network none --memory 512m --cpus 1 \
#     --read-only --tmpfs /tmp:size=64m \
#     --security-opt no-new-privileges -v $(pwd):/code:ro \
#     fodci/cpp-runner g++ -O2 -std=c++17 -o /tmp/sol /code/solution.cpp
#   # Execute
#   docker run --rm --network none --memory 256m --cpus 0.5 \
#     --read-only --tmpfs /tmp:size=16m \
#     --security-opt no-new-privileges \
#     --user judger -i fodci/cpp-runner /tmp/sol
FROM gcc:14

RUN apt-get update && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -r -s /usr/sbin/nologin -d /tmp judger

WORKDIR /sandbox
RUN chown judger:judger /sandbox

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bash"]
