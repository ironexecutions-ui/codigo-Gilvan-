import React, { createContext, useContext, useState, useEffect } from "react";

const VendaContext = createContext();

export function VendaProvider({ children }) {

    const [produtoAtual, setProdutoAtual] = useState(null);
    const [itens, setItens] = useState([]);
    const [total, setTotal] = useState(0);
    const [limparBusca, setLimparBusca] = useState(false);
    const [modalAberto, setModalAberto] = useState(false);

    function calcularTotal(lista) {
        const soma = lista.reduce((acc, item) => acc + item.subtotal, 0);
        setTotal(soma);
    }
    function limparVenda() {
        setProdutoAtual(null);
        setItens([]);
        setTotal(0);
        localStorage.removeItem("itensVenda");
    }

    function adicionarItem(produto) {
        setItens(prev => {
            const existente = prev.find(p => p.id === produto.id);

            if (existente) {
                const itemAtualizado = {
                    ...existente,
                    quantidade: existente.quantidade + 1,
                    subtotal: (existente.quantidade + 1) * existente.preco
                };

                // remove o antigo e coloca o atualizado NO FINAL
                const novaLista = [
                    ...prev.filter(p => p.id !== produto.id),
                    itemAtualizado
                ];

                calcularTotal(novaLista);
                return novaLista;
            }

            const novoItem = {
                id: produto.id,
                nome: produto.nome,
                preco: Number(produto.preco),
                quantidade: 1,
                subtotal: Number(produto.preco),
                unidade: produto.unidade || produto.tempo_servico || ""
            };

            // novo item entra no final
            const novaLista = [...prev, novoItem];
            calcularTotal(novaLista);
            return novaLista;
        });
    }

    function atualizarPrecoItem(produtoAtualizado) {
        setItens(prev => {
            const novaLista = prev.map(item => {
                if (item.id === produtoAtualizado.id) {
                    return {
                        ...item,
                        preco: produtoAtualizado.preco,
                        subtotal: produtoAtualizado.preco * item.quantidade
                    };
                }
                return item;
            });

            calcularTotal(novaLista);
            return novaLista;
        });
    }

    function aumentarQuantidade(id) {
        setItens(prev => {
            const novaLista = prev.map(item =>
                item.id === id
                    ? {
                        ...item,
                        quantidade: item.quantidade + 1,
                        subtotal: (item.quantidade + 1) * item.preco
                    }
                    : item
            );
            calcularTotal(novaLista);
            return novaLista;
        });
    }

    function diminuirQuantidade(id) {
        setItens(prev => {
            const item = prev.find(i => i.id === id);
            if (!item) return prev;

            if (item.quantidade === 1) {
                const novaLista = prev.filter(i => i.id !== id);
                calcularTotal(novaLista);
                return novaLista;
            }

            const novaLista = prev.map(i =>
                i.id === id
                    ? {
                        ...i,
                        quantidade: i.quantidade - 1,
                        subtotal: (i.quantidade - 1) * item.preco
                    }
                    : i
            );

            calcularTotal(novaLista);
            return novaLista;
        });
    }

    function removerItem(id) {
        setItens(prev => {
            const novaLista = prev.filter(item => item.id !== id);
            calcularTotal(novaLista);
            return novaLista;
        });
    }
    useEffect(() => {
        localStorage.setItem("itensVenda", JSON.stringify(itens));
    }, [itens]);

    return (
        <VendaContext.Provider value={{
            produtoAtual,
            setProdutoAtual,
            itens,
            adicionarItem,
            atualizarPrecoItem,
            aumentarQuantidade,
            diminuirQuantidade,
            removerItem,
            total,
            limparVenda,
            limparBusca,
            setLimparBusca,

            // 🔥 NOVO
            modalAberto,
            setModalAberto
        }}>
            {children}
        </VendaContext.Provider>
    );

}

export function useVenda() {
    return useContext(VendaContext);
}
