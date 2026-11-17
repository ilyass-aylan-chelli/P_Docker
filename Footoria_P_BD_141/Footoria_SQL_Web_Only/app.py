import os
import re
from datetime import date, datetime, time
from decimal import Decimal

from flask import Flask, jsonify, render_template, request
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

app = Flask(__name__)

# Dans Docker Compose, DATABASE_URL doit utiliser le nom du service SQL Server
# comme hôte (exemple : database), et non localhost.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("La variable DATABASE_URL n'est pas définie.")

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=1800)

# Studio volontairement limité à la lecture pour éviter les modifications
# accidentelles de la base depuis le navigateur.
BLOCKED_WORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|MERGE|GRANT|REVOKE|EXEC|EXECUTE|BACKUP|RESTORE|DBCC|SHUTDOWN|USE|INTO|OPENROWSET|OPENDATASOURCE)\b",
    re.IGNORECASE,
)


def json_value(value):
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, bytes):
        return value.hex()
    return value


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/api/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return jsonify({"connected": True, "message": "Connexion SQL Server établie"})
    except Exception:
        return jsonify({"connected": False, "message": "SQL Server inaccessible. Vérifie Docker et DATABASE_URL."}), 503


@app.post("/api/query")
def query_database():
    payload = request.get_json(silent=True) or {}
    sql = (payload.get("sql") or "").strip()

    if not sql:
        return jsonify({"error": "Écris une requête SQL avant de l'exécuter."}), 400
    if len(sql) > 10000:
        return jsonify({"error": "La requête dépasse la limite de 10 000 caractères."}), 400

    # Autorise uniquement une requête SELECT ou WITH, avec un point-virgule final facultatif.
    statement = sql[:-1].rstrip() if sql.endswith(";") else sql
    if ";" in statement:
        return jsonify({"error": "Une seule requête SQL à la fois est autorisée."}), 400
    if "--" in statement or "/*" in statement or "*/" in statement:
        return jsonify({"error": "Les commentaires SQL ne sont pas autorisés dans ce studio."}), 400
    if not re.match(r"^(SELECT|WITH)\b", statement, re.IGNORECASE):
        return jsonify({"error": "Seules les requêtes SELECT et WITH sont autorisées."}), 400
    if BLOCKED_WORDS.search(statement):
        return jsonify({"error": "Cette requête contient une instruction non autorisée en lecture seule."}), 400

    try:
        with engine.connect() as connection:
            result = connection.execute(text(statement))
            columns = list(result.keys())
            rows = result.fetchmany(200)
            row_data = [
                {column: json_value(value) for column, value in row.items()}
                for row in rows
            ]

        return jsonify({
            "columns": columns,
            "rows": row_data,
            "row_count": len(row_data),
            "limit": 200,
            "truncated_possible": len(row_data) == 200,
        })
    except SQLAlchemyError as error:
        # L'erreur détaillée est utile en développement; éviter d'exposer
        # des informations sensibles en production.
        message = str(error.orig) if getattr(error, "orig", None) else str(error)
        return jsonify({"error": message}), 400
    except Exception:
        return jsonify({"error": "Une erreur inattendue est survenue pendant la requête."}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")), debug=False)
