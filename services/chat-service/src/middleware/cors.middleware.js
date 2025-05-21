// middleware/cors.middleware.js
const cors = (req, res, next) => {
  // Permettre les requêtes de n'importe quelle origine
  res.header('Access-Control-Allow-Origin', '*');
  
  // Méthodes HTTP autorisées
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // En-têtes autorisés
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-access-token'
  );
  
  // Durée maximale du cache pour les pré-requêtes
  res.header('Access-Control-Max-Age', '86400');
  
  // Gérer les requêtes OPTIONS (pré-requêtes)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

module.exports = cors;