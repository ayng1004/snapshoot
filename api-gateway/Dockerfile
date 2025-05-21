FROM nginx:alpine

# Installer les outils si besoin (optionnel maintenant)
RUN apk add --no-cache curl netcat-openbsd

# Copier la config Nginx
COPY default.conf /etc/nginx/conf.d/

EXPOSE 80

# Démarrer nginx normalement
CMD ["nginx", "-g", "daemon off;"]
