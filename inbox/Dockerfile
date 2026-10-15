FROM node:22-alpine
# No npm dependencies on purpose: the server only uses the standard library.
# Less to audit and nothing that can be compromised through the supply chain.
WORKDIR /app
COPY inbox/ ./inbox/
COPY scripts/ ./scripts/
# Runs unprivileged. If someone manages to run something, it is not root.
USER node
ENV PORT=8080 PROYECTO_DIR=/proyecto
EXPOSE 8080
CMD ["node", "inbox/server.mjs"]
