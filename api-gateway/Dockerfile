# api-gateway/Dockerfile
FROM nginx:alpine

# Installer les outils réseau
RUN apk add --no-cache curl netcat-openbsd

COPY default.conf /etc/nginx/conf.d/
COPY wait-for-it.sh /
RUN chmod +x /wait-for-it.sh

EXPOSE 80

# Utiliser un script de démarrage qui attend que les services soient prêts
CMD ["/bin/sh", "-c", "/wait-for-it.sh auth-service 3000 && /wait-for-it.sh chat-service 3001 && nginx -g 'daemon off;'"]