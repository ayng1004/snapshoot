#!/bin/bash
# reset-databases.sh

echo "Réinitialisation des bases de données PostgreSQL..."

# Initialiser la base de données auth-service
echo "Initialisation de la base de données auth-service..."
docker-compose exec auth-db psql -U postgres -d auth_db -f /docker-entrypoint-initdb.d/init.sql

# Initialiser la base de données chat-service
echo "Initialisation de la base de données chat-service..."
docker-compose exec chat-db psql -U postgres -d chat_db -f /docker-entrypoint-initdb.d/init.sql

# Initialiser la base de données media-service
echo "Initialisation de la base de données media-service..."
docker-compose exec media-db psql -U postgres -d media_db -f /docker-entrypoint-initdb.d/init.sql

# Initialiser la base de données geo-service
echo "Initialisation de la base de données geo-service..."
docker-compose exec geo-db psql -U postgres -d geo_db -f /docker-entrypoint-initdb.d/init.sql

# Initialiser la base de données story-service
echo "Initialisation de la base de données story-service..."
docker-compose exec story-db psql -U postgres -d story_db -f /docker-entrypoint-initdb.d/init.sql

# Initialiser la base de données notification-service
echo "Initialisation de la base de données notification-service..."
docker-compose exec notification-db psql -U postgres -d notification_db -f /docker-entrypoint-initdb.d/init.sql

echo "Toutes les bases de données ont été réinitialisées avec succès!"