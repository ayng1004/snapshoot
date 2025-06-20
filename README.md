# 📸 Snapshoot

Développement complet d’une application mobile type **Snapchat / BeReal**, basée sur une architecture microservices scalable et un écosystème technique complet.

---

## 🚀 Fonctionnalités principales

- 📷 **Stories éphémères** (type Snapchat / BeReal)
- 💬 **Messagerie privée et en groupe**
- 🌍 **Géolocalisation des utilisateurs**
- 🔔 **Notifications temps réel** via WebSockets
- 📶 **Mode hors-ligne**
- 🧩 **Architecture microservices modulaire** (auth, chat, stories, média, géolocalisation, notifications)

---

## ⚙️ Architecture technique

### Backend (API)

- **Node.js / Express** (microservices indépendants)
- **API Gateway** : Nginx
- **Bases de données isolées** : PostgreSQL (PostGIS pour les données géographiques)
- **Stockage d'objets** : MinIO (S3 compatible)
- **Cache et temps réel** : Redis
- **Notifications temps réel** : WebSockets
- **Authentification & Sécurité** :
  - JWT (JSON Web Tokens)
  - Gestion des rôles
  - Bcrypt (hashing des mots de passe)
  - HTTPS, CORS, headers de sécurité renforcés

### Frontend (Mobile)

- **React Native (Expo)**
- Navigation fluide
- Interaction en temps réel avec le backend
- Scannez le QR Code avec Expo Go pour accéder à l’application

### Infrastructure

- **Docker & Docker Compose** pour la conteneurisation et l’orchestration des services
- **Architecture modulaire et scalable** prête pour le déploiement

---

## 📦 Prérequis

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/)
- [Expo Go](https://expo.dev/client) (sur smartphone)

---

## 🔧 Installation & Lancement

### 1️⃣ Cloner le projet

```bash
git clone https://github.com/ayng1004/snapshoot.git
cd Snapshoot
2️⃣ Lancer les microservices avec Docker
bash
docker-compose build --no-cache
docker-compose up
3️⃣ Configurer l'adresse IP de l'API pour l'application mobile
Ouvrez le fichier suivant :

bash
client/src/config/api.js
Modifiez l'adresse IP pour pointer vers votre machine locale (exemple : 192.168.1.42) :

javascript
export const SERVER_IP = '192.168.1.X:8080';
⚠ Important : utilisez l’adresse IP locale de votre réseau WiFi, visible depuis votre smartphone.

4️⃣ Lancer l’application mobile avec Expo
bash
npm install -g expo-cli
npx expo start
Scannez le QR Code avec l'application Expo Go sur votre smartphone.

L'application se lancera automatiquement.

📊 Stack technique
Technologie	Usage
Node.js / Express	Backend API
PostgreSQL / PostGIS	Base de données
Redis	Cache & temps réel
MinIO	Stockage d’objets
React Native (Expo)	Application mobile
Docker / Docker Compose	Conteneurisation
Nginx	API Gateway
WebSockets	Notifications temps réel
JWT / bcrypt	Authentification & sécurité

🔒 Sécurité
Authentification par JWT

Hashing des mots de passe avec bcrypt

Gestion fine des rôles utilisateurs

Sécurité réseau avec HTTPS, CORS, et headers stricts

📞 Support
En cas de problème ou de question, n’hésitez pas à ouvrir une issue sur le dépôt.

✨ Auteurs
Développé par ayng1004

Snapshoot est un projet éducatif complet visant à reproduire des fonctionnalités modernes d’applications sociales avec une architecture professionnelle.
