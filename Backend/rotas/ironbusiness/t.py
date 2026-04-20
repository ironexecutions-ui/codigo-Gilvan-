import jwt
from datetime import datetime, timedelta

CHAVE = "ironexecutions_super_secreto_2025"

payload = {
    "tipo": "sistema",
    "nome": "pdv-local",
    "exp": datetime.utcnow() + timedelta(days=365)
}

token_sistema = jwt.encode(payload, CHAVE, algorithm="HS256")
print(token_sistema)
