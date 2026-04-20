import jwt
from datetime import datetime, timedelta

CHAVE = "aqui precisa ter sua chave "  # por exemplo = CHAVE = "x9K$2fL@pQ7z!R#8tWm%VnB4cYh6Uj3E"

payload = {
    "tipo": "sistema",
    "nome": "pdv-local",
    "exp": datetime.utcnow() + timedelta(days=365)
}

token = jwt.encode(payload, CHAVE, algorithm="HS256")
print(token)
