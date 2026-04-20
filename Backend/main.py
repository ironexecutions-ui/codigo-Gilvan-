from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ===============================
# ROTAS IRON EXECUTIONS
# ===============================
from rotas.funcionarios import router as funcionarios_router
from rotas.servicos import router as servicos_router
from rotas.ganhos import router as ganhos_router
from rotas.anotacoes import router as anotacoes_router
from rotas.contratos import router as contratos_router
from rotas.supabase import router as supabase_router
from rotas.cores import router as cor_router
from rotas.pdf import router as pdf_router
from rotas.autorizacao import router as aut_router

# ===============================
# ROTAS IRON EXECUTIONS/IRONBUSINESS
# ===============================
from rotas.ironbusiness.produtos_imagem import router as upload_router
from rotas.ironbusiness.historico import router as h_router
from rotas.ironbusiness.cadastro_comercio import router as cadastro_comercio_router
from rotas.clientes import router as clientes_router
from rotas.ironbusiness.comercios import router as comercio_router
from rotas.ironbusiness.clientes_controle import router as ccon_router
from rotas.ironbusiness.comercios_cadastrados import router as comercios_cadastrados_router
from rotas.ironbusiness.login_clientes import router as login_clientes_router
from rotas.ironbusiness.modulos import router as modulos_router
from rotas.ironbusiness.clientes_senha import router as clientes_senha_router
from rotas.ironbusiness.modalmodulos import router as modalmodulos_router
from rotas.ironbusiness.modulos_publico import router as modulos_publicos_router
from rotas.ironbusiness.produtos_servicos import router as produtos_servicos_router
from rotas.ironbusiness.retornmodulos import router as retornmodulos_router
from rotas.ironbusiness.vendas import router as vendas_router
from rotas.ironbusiness.dados_comercio import router as dados_comercio_router
from rotas.ironbusiness.clientes_exibicao import router as clientes_exibicao_router
from rotas.ironbusiness.registra_rapido import router as registra_rapido_router
from rotas.ironbusiness.produtos_servicos_tabela import router as pst_router
from rotas.ironbusiness.imagens import router as i_router
from rotas.ironbusiness.grafico_pizza import router as gp_router
from rotas.ironbusiness.grafico_linhas import router as gl_router
from rotas.ironbusiness.graficos_barras import router as gb_router
from rotas.ironbusiness.venda_registro import router as vg_router
from rotas.ironbusiness.produtos_servico_admin import router as psa_router
from rotas.ironbusiness.analise import router as a_router
from rotas.ironbusiness.contabilidade import router as con_router
from rotas.ironbusiness.contabilidade_pdf import router as con_pdf_router
from rotas.ironbusiness.codigos import router as cod_router
from rotas.ironbusiness.fiscal_dados_cupons import router as fdc_router
from rotas.ironbusiness.fiscal_dados_comercio import router as fdco_router
from rotas.ironbusiness.fiscal_dados_cupons_lista import router as fdcl_router
from rotas.ironbusiness.comercios_publicos import router as copu_router
from rotas.ironbusiness.pix_caixa import router as pixc_router
from rotas.ironbusiness.pix_mercado import router as pixm_router
from rotas.ironbusiness.node import router as node_router
from rotas.ironbusiness.copiar import router as copiar_router
from rotas.ironbusiness.rifa.rifa_registro import router as riri_router
from rotas.ironbusiness.rifa.rifa_compras import router as ricom_router
from rotas.ironbusiness.rifa.rifa_imagem import router as riima_router
from rotas.ironbusiness.horas.horas import router as horas_router
from rotas.ironbusiness.jogos import router as jogos_router
from rotas.ironbusiness.jogos_quiz import router as jogos_quiz_router
from rotas.ironbusiness.alerta import router as alerta_router
from rotas.ironbusiness.cambio import router as cambioiron_router

from rotas.adminib.servicos_ib import router as servicos_ib_router
from rotas.adminib.pagamentos_ib import router as pagamento_router
from rotas.adminib.servicos_ib_prestados import router as servicos_ibp_router
from rotas.adminib.servicos_admin_ib import router as servicos_aib_router
from rotas.adminib.contagem import router as contagem_router

from aulas.matriculas import router as matricula_router
from aulas.pagos import router as pagos_router
from aulas.pagamentos_aulas import router as pagamentos_aulas_router

app = FastAPI()

# ===============================
# CORS LIMPO
# ===============================
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # aqui precisa ter seu dominio
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

@app.get("/preload")
async def preload():
    return {"ok": True}

# ===============================
# INCLUDE ROUTERS
# ===============================
app.include_router(pagamentos_aulas_router)
app.include_router(upload_router)
app.include_router(servicos_ib_router)
app.include_router(servicos_ibp_router)
app.include_router(servicos_aib_router)
app.include_router(matricula_router)
app.include_router(pagos_router)

app.include_router(cambioiron_router)
app.include_router(alerta_router)
app.include_router(ccon_router)
app.include_router(copiar_router)
app.include_router(h_router)
app.include_router(jogos_quiz_router)
app.include_router(pixm_router)
app.include_router(pixc_router)
app.include_router(contagem_router)
app.include_router(a_router)
app.include_router(aut_router)
app.include_router(node_router)
app.include_router(horas_router)
app.include_router(riima_router)
app.include_router(copu_router)
app.include_router(con_router)
app.include_router(con_pdf_router)
app.include_router(fdc_router)
app.include_router(fdco_router)
app.include_router(fdcl_router)
app.include_router(cod_router)
app.include_router(vg_router)
app.include_router(psa_router)
app.include_router(pst_router)
app.include_router(riri_router)
app.include_router(ricom_router)
app.include_router(i_router)
app.include_router(gp_router)
app.include_router(gl_router)
app.include_router(gb_router)
app.include_router(registra_rapido_router, prefix="/api")

app.include_router(clientes_senha_router)
app.include_router(funcionarios_router, prefix="/api")
app.include_router(servicos_router)
app.include_router(cor_router)
app.include_router(vendas_router)
app.include_router(dados_comercio_router)
app.include_router(clientes_router)
app.include_router(comercio_router)
app.include_router(comercios_cadastrados_router)
app.include_router(ganhos_router)
app.include_router(anotacoes_router)
app.include_router(modulos_publicos_router)
app.include_router(supabase_router)
app.include_router(cadastro_comercio_router)
app.include_router(produtos_servicos_router, prefix="/api")
app.include_router(contratos_router)
app.include_router(login_clientes_router)
app.include_router(pdf_router)
app.include_router(modulos_router)
app.include_router(modalmodulos_router)
app.include_router(retornmodulos_router)
app.include_router(clientes_exibicao_router)
app.include_router(pagamento_router)