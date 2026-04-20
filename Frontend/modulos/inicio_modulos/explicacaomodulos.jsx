import React, { useEffect, useState } from "react";
import "./explicacaomodulos.css";
import { API_URL } from "../../config";

export default function ExplicacaoModulos() {

    const [modulos, setModulos] = useState([]);
    const [erro, setErro] = useState("");

    useEffect(() => {
        async function carregar() {
            try {
                const resp = await fetch(`${API_URL}/modulos/ativos/publico`);
                const dados = await resp.json();
                setModulos(dados);
            } catch (err) {
                setErro("Não foi possível carregar os módulos.");
            }
        }

        carregar();
    }, []);

    return (
        <div className="explicacao-container-pub">

            <h2>Conheça os módulos</h2>

            <p className="explicacao-texto-pub">
                Cada módulo possui seu valor individual. Ao contratar
                <strong className="negrito-azul"> 2 módulos</strong>,
                você recebe <strong className="negrito-azul">15% de desconto</strong> sobre o valor de cada um.
                Na contratação de <strong className="negrito-azul">3 módulos</strong>,
                o desconto passa a ser de <strong className="negrito-azul">30%</strong>.
                Esses descontos são aplicados automaticamente e reduzem o custo mensal total.
            </p>

            <p className="explicacao-texto-pub">
                Existe ainda a opção de realizar um pagamento inicial de
                <strong className="negrito-azul"> R$ 100 por módulo contratado</strong>,
                cobrado uma única vez no início da contratação.
                Ao optar por esse pagamento antecipado,
                todas as mensalidades passam a contar com um
                <strong className="negrito-azul">desconto permanente de 40%</strong>,
                aplicado de forma adicional aos descontos por quantidade de módulos.
            </p>

            <p className="explicacao-texto-pub">
                Os descontos mencionados referem-se exclusivamente às mensalidades dos módulos.
                Os valores não se aplicam nem alteram os preços de serviços adicionais,
                implementações personalizadas ou demais serviços prestados fora do escopo dos módulos.
            </p>



            {erro && <p style={{ color: "red" }}>{erro}</p>}

            <div className="explicacao-bloco-pub">
                {modulos.length > 0 ? (
                    modulos
                        .filter(m => Number(m.preco) >= 1)
                        .map((m) => (
                            <div key={m.id} className="modulo-card-pub">
                                <h3>{m.nome}</h3>
                                <p>{m.texto}</p>

                                <p className="preco-info-pub">
                                    Preço sugerido, R$ {m.preco},00 mensais
                                </p>
                            </div>
                        ))
                ) : (
                    <p className="carregando-pub">
                        Carregando módulos...
                    </p>
                )}

            </div>
        </div>
    );
}
