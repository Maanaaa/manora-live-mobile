// Complète app.json : le fichier Firebase (notifications push Android) n'est pas dans le dépôt.
// En local : ./google-services.json ; sur EAS : variable d'environnement de type fichier GOOGLE_SERVICES_JSON.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
});
