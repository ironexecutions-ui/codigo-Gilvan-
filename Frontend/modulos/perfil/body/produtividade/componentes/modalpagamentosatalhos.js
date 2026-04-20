import { useEffect, useState } from "react";

export default function useNavegacaoTeclado(ativo, refsOrdenados) {
    const [indice, setIndice] = useState(0);

    useEffect(() => {
        if (!ativo || refsOrdenados.length === 0) return;

        // garante que sempre comece em algo válido
        let inicial = 0;
        while (
            refsOrdenados[inicial] &&
            refsOrdenados[inicial].current &&
            refsOrdenados[inicial].current.disabled
        ) {
            inicial++;
        }
        setIndice(inicial);
    }, [ativo, refsOrdenados]);

    useEffect(() => {
        if (!ativo) return;

        function mover(direcao) {
            let novo = indice;

            do {
                novo += direcao;
                if (novo < 0) novo = refsOrdenados.length - 1;
                if (novo >= refsOrdenados.length) novo = 0;
            } while (
                refsOrdenados[novo] &&
                refsOrdenados[novo].current &&
                refsOrdenados[novo].current.disabled
            );

            setIndice(novo);
            refsOrdenados[novo]?.current?.focus();
        }

        function onKeyDown(e) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                mover(1);
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                mover(-1);
            }

            if (e.key === "Enter") {
                e.preventDefault();
                const ref = refsOrdenados[indice];
                if (ref && ref.current && !ref.current.disabled) {
                    ref.current.click();
                }
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [ativo, indice, refsOrdenados]);

    return indice;
}
