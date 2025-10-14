# docker/asterisk/Dockerfile
FROM debian:bullseye-slim

USER root

# Install dependencies for building Asterisk
RUN apt-get update && apt-get install -y \
    build-essential git wget curl \
    libxml2-dev libncurses5-dev uuid-dev \
    libjansson-dev libssl-dev libsrtp2-dev \
    libedit-dev pkg-config subversion

# Download and build Asterisk (from GitHub instead of Gerrit)
WORKDIR /usr/src
RUN git clone -b 20 https://github.com/asterisk/asterisk.git asterisk

WORKDIR /usr/src/asterisk
RUN contrib/scripts/install_prereq install
RUN ./configure --with-pjproject-bundled --with-crypto --with-ssl=ssl --with-srtp
RUN make menuselect.makeopts
RUN menuselect/menuselect --enable res_srtp --enable chan_pjsip menuselect.makeopts
RUN make -j$(nproc) && make install && make samples && make config

# Create runtime user
RUN adduser --system --group --home /var/lib/asterisk asterisk
RUN mkdir -p /var/log/asterisk /var/run/asterisk /etc/asterisk \
    && chown -R asterisk:asterisk /var/*/asterisk /etc/asterisk

USER asterisk

EXPOSE 5060/udp 5060/tcp 8089 10000-10200/udp

CMD ["/usr/sbin/asterisk", "-f", "-U", "asterisk"]
