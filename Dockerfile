FROM debian:12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    iputils-ping \
    iproute2 \
    dnsutils \
    traceroute \
    curl \
    net-tools \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

CMD ["sleep", "infinity"]
