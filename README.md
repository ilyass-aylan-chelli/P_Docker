# Footoria – SQL Server & Docker

## Présentation

Footoria est un projet de base de données permettant de gérer des informations liées au football : joueurs, équipes, compétitions, matchs et qualifications.

Ce projet utilise Docker pour automatiser le déploiement de SQL Server et de l'application web Footoria SQL Studio.

L'objectif est de pouvoir démarrer l'environnement complet sans devoir installer SQL Server manuellement sur sa machine.

## Technologies utilisées

| Technologie | Utilisation |
|---|---|
| Docker | Conteneurisation |
| Docker Compose | Gestion des services |
| Microsoft SQL Server 2022 | Gestion de la base de données |
| Python / Flask | API backend |
| HTML | Structure du site |
| CSS | Design |
| JavaScript | Interface SQL |
| ODBC Driver 18 | Connexion à SQL Server |

## Architecture du projet

```text
Footoria/
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
│
├── database-init/
│   └── init_db.py
│
├── sql/
│   ├── 1_projet-141-ilyass-chelli.sql
│   ├── 2_donnes.sql
│   └── 3_donnes-partie-2.sql
│
└── Footoria_SQL_Web_Only/
    ├── Dockerfile
    ├── app.py
    ├── requirements.txt
    ├── templates/
    │   └── index.html
    └── static/
        ├── style.css
        └── app.js
```

## Fonctionnement

Le projet repose sur trois services Docker :

### 1. Database

Conteneur Microsoft SQL Server 2022.

- Stockage des données Footoria.
- Port interne : 1433.
- Volume Docker pour conserver les données.

### 2. Database Init

Service chargé de l'initialisation automatique de la base.

Il doit :

1. Attendre que SQL Server soit disponible.
2. Exécuter le script de création de la base.
3. Insérer les données initiales.
4. Exécuter les scripts complémentaires.

L'initialisation doit être effectuée uniquement lorsque la base n'a pas encore été créée.

### 3. Web

Application web Footoria SQL Studio.

Elle permet de :

- Écrire des requêtes SQL.
- Exécuter les requêtes sur SQL Server.
- Afficher les résultats sous forme de tableau.
- Consulter les erreurs SQL.

Le site est accessible sur le port 8080.

## Installation

### Prérequis

- Docker Engine
- Docker Compose
- Git

### 1. Cloner le dépôt

```bash
git clone URL_DU_DEPOT
cd Footoria
```

Remplacer `URL_DU_DEPOT` par l'adresse réelle du dépôt GitHub.

### 2. Configurer les variables d'environnement

Copier le fichier d'exemple :

```bash
cp .env.example .env
```

Modifier les mots de passe dans `.env`.

Ne jamais publier ce fichier sur GitHub.

### 3. Démarrer le projet

```bash
docker compose up -d --build
```

Docker construit les images, démarre SQL Server, initialise la base et lance le site lorsque les dépendances sont prêtes.

### 4. Accéder au site web

Ouvrir :

```text
http://localhost:8080
```

## Commandes Docker utiles

| Commande | Fonction |
|---|---|
| `docker compose up -d --build` | Construire et démarrer |
| `docker compose down` | Arrêter les services |
| `docker compose ps` | Voir les conteneurs |
| `docker compose logs -f` | Voir les journaux |
| `docker compose logs database` | Logs SQL Server |
| `docker compose logs web` | Logs du site |
| `docker compose restart` | Redémarrer les services |

Attention : `docker compose down -v` supprime également les volumes déclarés et peut donc supprimer les données SQL Server.

## Sécurité

- Ne jamais publier les mots de passe SQL Server.
- Utiliser des mots de passe robustes.
- Ne pas exposer SQL Server directement sur Internet.
- Proté
