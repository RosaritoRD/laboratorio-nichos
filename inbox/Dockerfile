FROM node:22-alpine
# Sin dependencias npm a propósito: el servidor usa solo la librería estándar.
# Menos superficie que auditar y nada que se pueda comprometer por la cadena.
WORKDIR /app
COPY inbox/ ./inbox/
COPY scripts/ ./scripts/
# Corre sin privilegios. Si alguien logra ejecutar algo, no es root.
USER node
ENV PORT=8080 PROYECTO_DIR=/proyecto
EXPOSE 8080
CMD ["node", "inbox/server.mjs"]
