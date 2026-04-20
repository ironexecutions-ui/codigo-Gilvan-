import mysql.connector
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/migracao", tags=["Migração Produtos"])

# ===============================
# BANCO ORIGEM (produtos)
# ===============================
CONFIG_ORIGEM = {
    "host": "sql5.freesqldatabase.com",
    "user": "sql5807682",
    "password": "ki8p2GZan2",
    "database": "sql5807682",
    "port": 3306
}

# ===============================
# BANCO DESTINO (produtos_servicos)
# ===============================
CONFIG_DESTINO = {
    "host": "sql5.freesqldatabase.com",
    "user": "sql5807683",
    "password": "RKCTBqiFvy",
    "database": "sql5807683",
    "port": 3306
}


@router.post("/copiar-produtos")
def copiar_produtos():
    try:
        conn_origem = mysql.connector.connect(**CONFIG_ORIGEM)
        conn_destino = mysql.connector.connect(**CONFIG_DESTINO)

        cur_origem = conn_origem.cursor(dictionary=True)
        cur_destino = conn_destino.cursor()

        # ===============================
        # BUSCAR PRODUTOS
        # ===============================
        cur_origem.execute("""
            SELECT 
                codigo_barras,
                nome,
                categoria,
                preco_venda,
                unidade_medida,
                imagem_url
            FROM produtos
        """)

        produtos = cur_origem.fetchall()

        if not produtos:
            return {"ok": False, "mensagem": "Nenhum produto encontrado"}

        inseridos = 0

        # ===============================
        # INSERIR EM produtos_servicos
        # ===============================
        for p in produtos:
            cur_destino.execute("""
                INSERT INTO produtos_servicos (
                    codigo_barras,
                    nome,
                    categoria,
                    preco,
                    unidade,
                    imagem_url,
                    comercio_id,
                    disponivel
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                p["codigo_barras"],
                p["nome"],
                p["categoria"],
                p["preco_venda"],
                p["unidade_medida"],
                (p["imagem_url"] or "") + "|",
                29,
                1
            ))

            inseridos += 1

        conn_destino.commit()

        return {
            "ok": True,
            "produtos_copiados": inseridos
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        try:
            cur_origem.close()
            cur_destino.close()
            conn_origem.close()
            conn_destino.close()
        except:
            pass
