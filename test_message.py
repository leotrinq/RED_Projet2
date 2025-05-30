import json
from jsonschema import validate, ValidationError
import os

# Fonction de validation générique
def valider_schema(data, schema):
    try:
        validate(instance=data, schema=schema)
        return True, ""
    except ValidationError as e:
        return False, e.message

# Charger le schéma noyau
with open("schema_noyau.json", "r") as f:
    schema_noyau = json.load(f)

# Charger un exemple de message
ex1 = "exemple_message_films.json"
ex2 = "exemple_message_jeuxvideos.json"
ex3 = "exemple_message_astronomie.json"
with open(ex3, "r") as f:
    message = json.load(f)

# Valider le noyau (en ignorant l'extension)
message_noyau = {
    "fil": message["fil"],
    "message": {
        k: v for k, v in message["message"].items() if not k.startswith("extension_")
    }
}

ok, err = valider_schema(message_noyau, schema_noyau)
if not ok:
    print("Erreur validation noyau :", err)
    exit(1)

# Détecter l'extension présente
extensions_possibles = [k for k in message["message"] if k.startswith("extension_")]
if extensions_possibles:
    nom_extension = extensions_possibles[0]  # ex : "extension_films"
    schema_filename = f"schema_{nom_extension}.json"
    
    if not os.path.exists(schema_filename):
        print(f"Schéma non trouvé pour l’extension : {nom_extension}")
        exit(1)

    with open(schema_filename, "r") as f:
        schema_ext = json.load(f)

    ok, err = valider_schema(message["message"][nom_extension], schema_ext)
    if not ok:
        print(f"rreur validation extension {nom_extension} :", err)
        exit(1)
else:
    print("Aucun champ d’extension détecté. Seul le noyau est validé.")

# Affichage
print(f"\nMessage VALIDE ({nom_extension if extensions_possibles else 'noyau uniquement'})")
print(f"Fil : {message['fil']['titre']} ({message['fil']['id']})")
print(f"Participants : {', '.join(message['fil']['participants'])}\n")

msg = message["message"]
print(f"Message de {msg['expediteur']} le {msg['date']}:")
print(msg["texte"])

print("\n🔹 Structure :")
print(f" Type : {msg['structure']['type']}")
print(f" Question : {msg['structure']['question']}")
if "options" in msg["structure"]:
    print(f" Options : {', '.join(msg['structure']['options'])}")

if extensions_possibles:
    print(f"\nDonnées d’extension ({nom_extension}) :")
    for cle, valeur in message["message"][nom_extension].items():
        print(f" {cle} : {valeur}")
