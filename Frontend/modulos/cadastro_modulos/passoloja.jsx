import React, { useState } from "react";
import uploadImagemSupabase from "./supabaseupload";
import "./passoloja.css";

export default function Passo1Loja({ onContinuar }) {

    const [form, setForm] = useState({
        loja: "",
        cnpj: "",
        cep: "",
        rua: "",
        bairro: "",
        numero: "",
        cidade: "",
        estado: "",
        email: "",
        celular: ""
    });

    const [imagem, setImagem] = useState(null);
    const [preview, setPreview] = useState(null);
    const [carregando, setCarregando] = useState(false);

    function alterarCampo(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    function alterarCep(e) {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length > 8) v = v.slice(0, 8);
        if (v.length > 5) {
            v = v.replace(/^(\d{5})(\d)/, "$1-$2");
        }
        setForm(prev => ({ ...prev, cep: v }));
    }

    function alterarNumero(e) {
        const v = e.target.value.replace(/\D/g, "");
        setForm(prev => ({ ...prev, numero: v }));
    }

    function alterarEstado(e) {
        const v = e.target.value.toUpperCase();
        setForm(prev => ({ ...prev, estado: v }));
    }

    function alterarCelular(e) {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length > 11) v = v.slice(0, 11);

        if (v.length > 6) {
            v = v.replace(/^(\d{2})(\d{5})(\d)/, "($1) $2-$3");
        } else if (v.length > 2) {
            v = v.replace(/^(\d{2})(\d)/, "($1) $2");
        }

        setForm(prev => ({ ...prev, celular: v }));
    }

    function selecionarImagem(e) {
        const file = e.target.files[0];
        setImagem(file);

        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    }

    async function enviar(e) {
        e.preventDefault();

        if (!form.loja.trim()) {
            alert("Digite o nome da loja");
            return;
        }

        setCarregando(true);

        let linkFinal = null;

        if (imagem) {
            linkFinal = await uploadImagemSupabase(imagem, "ironbusiness");
        }

        onContinuar({
            ...form,
            imagem: linkFinal || null
        });

        setCarregando(false);
    }
    function alterarCnpj(e) {
        let v = e.target.value.replace(/\D/g, "");
        if (v.length > 14) v = v.slice(0, 14);

        v = v.replace(/^(\d{2})(\d)/, "$1.$2");
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
        v = v.replace(/(\d{4})(\d)/, "$1-$2");

        setForm(prev => ({ ...prev, cnpj: v }));
    }

    return (
        <div className="passo1-container">
            <h3 className="titulo">Informações da loja</h3>

            <form onSubmit={enviar} className="formulario">

                <label>Nome do comércio</label>
                <input name="loja" value={form.loja} onChange={alterarCampo} />

                <label>CNPJ</label>
                <input
                    name="cnpj"
                    value={form.cnpj}
                    onChange={alterarCnpj}
                    placeholder="00.000.000/0000-00"
                />


                <label>CEP</label>
                <input
                    name="cep"
                    value={form.cep}
                    onChange={alterarCep}
                    placeholder="00000-000"
                />

                <label>Rua</label>
                <input name="rua" value={form.rua} onChange={alterarCampo} />

                <label>Bairro</label>
                <input name="bairro" value={form.bairro} onChange={alterarCampo} />

                <label>Número</label>
                <input
                    name="numero"
                    value={form.numero}
                    onChange={alterarNumero}
                />

                <label>Cidade</label>
                <input name="cidade" value={form.cidade} onChange={alterarCampo} />

                <label>Estado</label>
                <input
                    name="estado"
                    value={form.estado}
                    onChange={alterarEstado}
                    list="ufs"
                    maxLength={2}
                />
                <datalist id="ufs">
                    <option value="AC" />
                    <option value="AL" />
                    <option value="AP" />
                    <option value="AM" />
                    <option value="BA" />
                    <option value="CE" />
                    <option value="DF" />
                    <option value="ES" />
                    <option value="GO" />
                    <option value="MA" />
                    <option value="MT" />
                    <option value="MS" />
                    <option value="MG" />
                    <option value="PA" />
                    <option value="PB" />
                    <option value="PR" />
                    <option value="PE" />
                    <option value="PI" />
                    <option value="RJ" />
                    <option value="RN" />
                    <option value="RS" />
                    <option value="RO" />
                    <option value="RR" />
                    <option value="SC" />
                    <option value="SP" />
                    <option value="SE" />
                    <option value="TO" />
                </datalist>

                <label>Email do comércio</label>
                <input name="email" value={form.email} onChange={alterarCampo} />

                <label>Celular</label>
                <input
                    name="celular"
                    value={form.celular}
                    onChange={alterarCelular}
                    placeholder="(00) 00000-0000"
                />

                <label>Imagem do comércio</label>
                <input type="file" accept="image/*" onChange={selecionarImagem} />

                {preview && <img src={preview} className="preview-img" />}

                <button type="submit" disabled={carregando}>
                    {carregando ? "Enviando..." : "Continuar"}
                </button>
            </form>
        </div>
    );
}
