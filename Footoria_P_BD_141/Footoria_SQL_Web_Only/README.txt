FOOTORIA SQL STUDIO - INTERFACE WEB SEULE

Contenu :
- app.py : petite API Flask (/api/query et /api/health)
- templates/index.html : page HTML
- static/style.css : design
- static/app.js : envoi des requetes et affichage des resultats

IMPORTANT
Le navigateur ne se connecte pas directement a SQL Server. Le JavaScript envoie la requete a Flask, puis Flask utilise DATABASE_URL pour joindre SQL Server.

CONFIGURATION DOCKER
Ce dossier est prevu pour etre copie dans le dossier de ton service web existant. Le conteneur web doit avoir :
- PORT=8080
- DATABASE_URL avec le nom du service SQL Server comme hote (par exemple database:1433)
- le pilote Microsoft ODBC Driver 18 installe

Exemple de DATABASE_URL (remplace le mot de passe et le nom de la base) :
mssql+pyodbc://sa:MotDePasse123%21@database:1433/footoria?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes

Le service web doit exposer le port :
ports:
  - "8080:8080"

Et demarrer avec :
python app.py

Ouvre ensuite : http://localhost:8080

SECURITE
L'API refuse les requetes autres que SELECT / WITH, les requetes multiples et les commentaires SQL. Limite les resultats a 200 lignes. Pour un vrai deploiement, configure egalement un utilisateur SQL Server dedie avec uniquement le droit SELECT.

Cette interface n'importe pas les scripts SQL et ne cree pas les tables : elle interroge la base qui existe deja dans SQL Server.
