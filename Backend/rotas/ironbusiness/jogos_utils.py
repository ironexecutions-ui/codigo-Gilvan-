import random
import string
from database import executar_select

def gerar_codigo_jogo():
    while True:
        codigo = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=4)
        )

        existe = executar_select(
            "SELECT id FROM jogos WHERE codigo = %s",
            (codigo,)
        )

        if not existe:
            return codigo
