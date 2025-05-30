# Générateur de message structuré

Ce projet est une application React permettant de générer des messages structurés au format JSON, selon des règles précises définies dans des schémas JSON. Il couvre différents thèmes (films, jeux vidéo, astronomie).

## Fonctionnalités

- Choix d'une extension (films, jeux vidéos, astronomie)
- Remplissage automatique ou manuel des champs
- Génération d’un message JSON conforme :
  - au schéma noyau
  - au schéma spécifique à l’extension choisie
- Validation complète avec AJV (types, contraintes, conditions, etc.)
- Affichage détaillé des erreurs de validation
- Affichage du JSON généré et option de téléchargement

## Utilisation

Exécuter les commandes :
npm install
npm run dev

Puis ouvrir http://localhost:5173.

Structure du projet
.
├── public/
│   ├── schema_noyau.json
│   ├── schema_extension_films.json
│   ├── schema_extension_jeuxvideos.json
│   └── schema_extension_astronomie.json
├── src/
│   └── App.jsx
├── package.json
└── README.md
