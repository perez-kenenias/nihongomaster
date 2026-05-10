FROM alpine:3.19

RUN apk add --no-cache \
    curl \
    bash \
    ffmpeg \
    python3 \
    py3-pip

WORKDIR /app

ENV WHISPER_CPP_VERSION=1.6.2

RUN curl -L "https://github.com/ggerganov/whisper.cpp/releases/download/v${WHISPER_CPP_VERSION}/whisper-cli" -o /usr/local/bin/whisper-cli && \
    chmod +x /usr/local/bin/whisper-cli

RUN pip3 install flask

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["/entrypoint.sh"]
