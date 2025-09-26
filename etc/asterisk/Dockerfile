# Base: Debian slim
# ============================
# Asterisk 20 - Custom Build
# ============================

# Base: Debian slim
FROM debian:bullseye-slim

ENV DEBIAN_FRONTEND=noninteractive \
    ASTERISK_VERSION=20.7.0 \
    ASTERISK_USER=asterisk \
    ASTERISK_GROUP=asterisk

# ----------------------------
# 1. Install dependencies
# ----------------------------
RUN apt-get update && apt-get install -y \
    build-essential wget curl gnupg2 git \
    libxml2-dev libncurses5-dev uuid-dev \
    libjansson-dev libssl-dev libsqlite3-dev \
    libedit-dev pkg-config net-tools iproute2 \
    && rm -rf /var/lib/apt/lists/*

# ----------------------------
# 2. Download and compile Asterisk
# ----------------------------
WORKDIR /usr/src
RUN wget http://downloads.asterisk.org/pub/telephony/asterisk/releases/asterisk-${ASTERISK_VERSION}.tar.gz \
    && tar xfz asterisk-${ASTERISK_VERSION}.tar.gz \
    && cd asterisk-${ASTERISK_VERSION} \
    && ./configure --with-jansson-bundled \
    && make menuselect.makeopts \
    && menuselect/menuselect --enable CORE-SOUNDS-EN-GSM --enable MOH-OPSOUND-WAV menuselect.makeopts \
    && make -j$(nproc) && make install && make samples && make config \
    && ldconfig

# ----------------------------
# 3. Create Asterisk user/group
# ----------------------------
RUN groupadd -r ${ASTERISK_GROUP} && useradd -r -g ${ASTERISK_GROUP} ${ASTERISK_USER}

# ----------------------------
# 4. Ensure runtime directories exist
# ----------------------------
RUN mkdir -p /var/run/asterisk /var/lib/asterisk /var/log/asterisk /var/spool/asterisk /usr/lib/asterisk /etc/asterisk \
    && chown -R ${ASTERISK_USER}:${ASTERISK_GROUP} /var/run/asterisk /var/lib/asterisk /var/log/asterisk /var/spool/asterisk /usr/lib/asterisk /etc/asterisk

# ----------------------------
# 5. Copy configs
# ----------------------------
COPY config/ /etc/asterisk/

# ----------------------------
# 6. Expose SIP, WS, RTP
# ----------------------------
EXPOSE 5060/tcp 5060/udp 8089/tcp 10000-10200/udp

# ----------------------------
# 7. Run as non-root
# ----------------------------
USER ${ASTERISK_USER}

# ----------------------------
# 8. Entrypoint
# ----------------------------
CMD ["/usr/sbin/asterisk", "-f", "-U", "asterisk", "-C", "/etc/asterisk/asterisk.conf"]

