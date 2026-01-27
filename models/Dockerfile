FROM quay.io/go-skynet/local-ai:latest-aio-cpu
WORKDIR /build
COPY models/ /models/
ENV THREADS=8
ENV CONTEXT_SIZE=4096
ENV MODELS_PATH=/models
ENV DEBUG=true
EXPOSE 8080
CMD ["local-ai"]
