# Base: Debian slim
FROM debian:bullseye-slim

ENV DEBIAN_FRONTEND=noninteractive \
    ASTERISK_VERSION=20.7.0 \
    ASTERISK_USER=asterisk

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential wget curl gnupg2 git \
    libxml2-dev libncurses5-dev uuid-dev \
    libjansson-dev libssl-dev libsqlite3-dev \
    libedit-dev pkg-config net-tools iproute2 \
    && rm -rf /var/lib/apt/lists/*

# Download and compile Asterisk
WORKDIR /usr/src
RUN wget http://downloads.asterisk.org/pub/telephony/asterisk/asterisk-${ASTERISK_VERSION}.tar.gz \
    && tar xfz asterisk-${ASTERISK_VERSION}.tar.gz \
    && cd asterisk-${ASTERISK_VERSION} \
    && ./configure --with-jansson-bundled \
    && make menuselect.makeopts \
    && menuselect/menuselect --enable CORE-SOUNDS-EN-GSM --enable MOH-OPSOUND-WAV menuselect.makeopts \
    && make -j$(nproc) && make install && make samples && make config \
    && ldconfig

# Create asterisk user
RUN useradd -m ${ASTERISK_USER} \
    && chown -R ${ASTERISK_USER}:${ASTERISK_USER} /var/lib/asterisk /etc/asterisk /var/log/asterisk /var/spool/asterisk /usr/lib/asterisk

# Copy your configs
COPY config/ /etc/asterisk/

# Expose SIP, WebSocket, RTP
EXPOSE 5060/tcp 5060/udp 8089/tcp 10000-10200/udp

USER ${ASTERISK_USER}
CMD ["/usr/sbin/asterisk", "-f", "-U", "asterisk"]
