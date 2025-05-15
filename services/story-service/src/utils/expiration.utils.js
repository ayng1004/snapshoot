// Calculer la date d'expiration (24h par défaut)
const calculateExpirationDate = (durationHours = 24) => {
  const now = new Date();
  return new Date(now.getTime() + durationHours * 60 * 60 * 1000);
};

// Vérifier si une date est expirée
const isExpired = (date) => {
  const now = new Date();
  return date < now;
};

module.exports = {
  calculateExpirationDate,
  isExpired
};