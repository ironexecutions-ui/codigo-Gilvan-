import React, { useState } from "react";
import "./estruturacurso.css";

export default function EstruturaCurso() {

    const [visivel, setVisivel] = useState(2);

    const meses = [

        {
            titulo: "🔵 MÊS 1 – FUNDAMENTOS DE HTML",
            semanas: [
                {
                    titulo: "Semana 1 – Estrutura base",
                    aulas: [
                        {
                            nome: "Aula 1",
                            duracao: "1h30",
                            conteudo: [
                                "Como o navegador interpreta HTML",
                                "Criação do primeiro arquivo index.html",
                                "Estrutura base: html, head, body",
                                "Uso de títulos (h1 até h6)",
                                "Parágrafos e organização de texto",
                                "Erros comuns de iniciantes"
                            ]
                        },
                        {
                            nome: "Aula 2",
                            duracao: "2h",
                            conteudo: [
                                "Listas ordenadas e não ordenadas",
                                "Uso de li na prática",
                                "Separadores com hr e quebras com br",
                                "Organização visual do conteúdo",
                                "Criação de página com estrutura completa"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 2 – Navegação",
                    aulas: [
                        {
                            nome: "Aula 3",
                            duracao: "1h30",
                            conteudo: [
                                "Inserção de imagens (img, src, alt)",
                                "Caminhos de arquivos (relativo vs absoluto)",
                                "Criação de links (a, href)",
                                "Abrir links em nova aba",
                                "Boas práticas com imagens"
                            ]
                        },
                        {
                            nome: "Aula 4",
                            duracao: "2h",
                            conteudo: [
                                "Criação de menu de navegação",
                                "Estrutura de múltiplas páginas",
                                "Conectar páginas com links",
                                "Organização de pastas do projeto",
                                "Construção de mini site com 2 páginas"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 3 – Estrutura avançada",
                    aulas: [
                        {
                            nome: "Aula 5",
                            duracao: "1h30",
                            conteudo: [
                                "Criação de tabelas (table, tr, td, th)",
                                "Organização de dados em tabela",
                                "Uso real de tabelas em projetos"
                            ]
                        },
                        {
                            nome: "Aula 6",
                            duracao: "2h",
                            conteudo: [
                                "Tags semânticas (header, main, footer, section)",
                                "Diferença entre div e semântica",
                                "Estrutura profissional de site",
                                "Montagem de layout completo"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 4 – Formulários",
                    aulas: [
                        {
                            nome: "Aula 7",
                            duracao: "1h30",
                            conteudo: [
                                "Inputs: text, email, password",
                                "Uso correto de labels",
                                "Organização de formulário",
                                "Validações básicas do HTML"
                            ]
                        },
                        {
                            nome: "Aula 8",
                            duracao: "2h",
                            conteudo: [
                                "Select, textarea, button",
                                "Criação de formulário completo",
                                "Simulação de cadastro",
                                "Estrutura de página de cadastro"
                            ]
                        }
                    ]
                }
            ]
        },

        {
            titulo: "🟣 MÊS 2 – CSS (ESTILO E DESIGN)",
            semanas: [
                {
                    titulo: "Semana 5 – Introdução ao CSS",
                    aulas: [
                        {
                            nome: "Aula 9",
                            duracao: "1h30",
                            conteudo: [
                                "O que é CSS e como funciona",
                                "CSS inline, interno e externo",
                                "Criação do arquivo styles.css",
                                "Seletores básicos"
                            ]
                        },
                        {
                            nome: "Aula 10",
                            duracao: "2h",
                            conteudo: [
                                "Cores (hex, rgb)",
                                "Fontes e tamanhos",
                                "Estilização de texto",
                                "Melhoria visual do HTML"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 6 – Box Model",
                    aulas: [
                        {
                            nome: "Aula 11",
                            duracao: "1h30",
                            conteudo: [
                                "Margin, padding, border",
                                "Espaçamento entre elementos",
                                "Visualização do box model"
                            ]
                        },
                        {
                            nome: "Aula 12",
                            duracao: "2h",
                            conteudo: [
                                "Width e height",
                                "Controle de tamanho de elementos",
                                "Criação de layout organizado"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 7 – Layout moderno",
                    aulas: [
                        {
                            nome: "Aula 13",
                            duracao: "1h30",
                            conteudo: [
                                "Display flex",
                                "Direção (row, column)",
                                "Alinhamento básico"
                            ]
                        },
                        {
                            nome: "Aula 14",
                            duracao: "2h",
                            conteudo: [
                                "Justify-content e align-items",
                                "Centralização completa",
                                "Criação de layout moderno"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 8 – Responsividade",
                    aulas: [
                        {
                            nome: "Aula 15",
                            duracao: "1h30",
                            conteudo: [
                                "Media queries",
                                "Mobile first",
                                "Adaptação de layout"
                            ]
                        },
                        {
                            nome: "Aula 16",
                            duracao: "2h",
                            conteudo: [
                                "Ajustes para celular",
                                "Correções de layout quebrado",
                                "Projeto responsivo completo"
                            ]
                        }
                    ]
                }
            ]
        },

        {
            titulo: "🟡 MÊS 3 – JAVASCRIPT (BASE)",
            semanas: [
                {
                    titulo: "Semana 9 – Fundamentos",
                    aulas: [
                        {
                            nome: "Aula 17",
                            duracao: "1h30",
                            conteudo: [
                                "O que é JavaScript",
                                "Variáveis (let, const)",
                                "Tipos de dados",
                                "console.log",
                                "Boas práticas"
                            ]
                        },
                        {
                            nome: "Aula 18",
                            duracao: "2h",
                            conteudo: [
                                "If e else",
                                "Operadores lógicos",
                                "Comparações",
                                "Exercícios guiados",
                                "Resolução passo a passo"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 10 – Funções e organização",
                    aulas: [
                        {
                            nome: "Aula 19",
                            duracao: "1h30",
                            conteudo: [
                                "Funções",
                                "Parâmetros",
                                "Return",
                                "Reutilização de código"
                            ]
                        },
                        {
                            nome: "Aula 20",
                            duracao: "2h",
                            conteudo: [
                                "Escopo (local e global)",
                                "let vs const",
                                "Organização de lógica",
                                "Mini desafios práticos"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 11 – Estruturas de dados",
                    aulas: [
                        {
                            nome: "Aula 21",
                            duracao: "1h30",
                            conteudo: [
                                "Arrays",
                                "Adicionar e remover itens",
                                "Percorrer arrays",
                                "Uso real em listas"
                            ]
                        },
                        {
                            nome: "Aula 22",
                            duracao: "2h",
                            conteudo: [
                                "Objetos",
                                "Chave e valor",
                                "Acessar dados",
                                "Simular usuários",
                                "Combinar arrays + objetos"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 12 – Loops e lógica",
                    aulas: [
                        {
                            nome: "Aula 23",
                            duracao: "1h30",
                            conteudo: [
                                "for",
                                "while",
                                "Percorrer listas",
                                "Lógica repetitiva"
                            ]
                        },
                        {
                            nome: "Aula 24",
                            duracao: "2h",
                            conteudo: [
                                "Desafios de lógica",
                                "Resolução guiada",
                                "Pensamento de programação",
                                "Preparação para trabalhar com dados reais"
                            ]
                        }
                    ]
                }
            ]
        }
        ,
        {
            titulo: "🟢 MÊS 4 – JAVASCRIPT INTERMEDIÁRIO + INTRO REACT",
            semanas: [
                {
                    titulo: "Semana 13 – Manipulação de dados",
                    aulas: [
                        {
                            nome: "Aula 25",
                            duracao: "1h30",
                            conteudo: [
                                "map",
                                "filter",
                                "Transformar dados",
                                "Criar listas dinâmicas"
                            ]
                        },
                        {
                            nome: "Aula 26",
                            duracao: "2h",
                            conteudo: [
                                "reduce (introdução)",
                                "Combinar dados",
                                "Casos reais",
                                "Preparação para renderização em React"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 14 – JSON e API",
                    aulas: [
                        {
                            nome: "Aula 27",
                            duracao: "1h30",
                            conteudo: [
                                "O que é JSON",
                                "Estrutura de dados",
                                "Converter dados"
                            ]
                        },
                        {
                            nome: "Aula 28",
                            duracao: "2h",
                            conteudo: [
                                "O que é API",
                                "Requisição e resposta",
                                "Entender dados externos",
                                "Simular dados para frontend"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 15 – Requisições",
                    aulas: [
                        {
                            nome: "Aula 29",
                            duracao: "1h30",
                            conteudo: [
                                "fetch GET",
                                "Consumir API pública",
                                "Trabalhar com dados"
                            ]
                        },
                        {
                            nome: "Aula 30",
                            duracao: "2h",
                            conteudo: [
                                "async/await",
                                "try/catch",
                                "Tratar erros",
                                "Preparação para useEffect no React"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 16 – Introdução ao React + Integração",
                    aulas: [
                        {
                            nome: "Aula 31",
                            duracao: "1h30",
                            conteudo: [
                                "O que é React",
                                "Diferença entre JS e React",
                                "SPA (Single Page Application)",
                                "JSX (conceito)",
                                "Primeiro componente simples"
                            ]
                        },
                        {
                            nome: "Aula 32",
                            duracao: "2h",
                            conteudo: [
                                "useState (conceito)",
                                "Renderização dinâmica",
                                "Simular dados vindo do backend",
                                "Como React conversa com API",
                                "Preparação para integração com Python"
                            ]
                        }
                    ]
                }
            ]
        },
        {
            titulo: "🔵 MÊS 5 – REACT (FRONTEND PROFISSIONAL + INTRO BACKEND)",
            semanas: [
                {
                    titulo: "Semana 17 – Estrutura e Componentização",
                    aulas: [
                        {
                            nome: "Aula 33",
                            duracao: "1h30",
                            conteudo: [
                                "Revisão rápida do React",
                                "Criar projeto com Vite",
                                "Estrutura de pastas profissional",
                                "Separação por componentes"
                            ]
                        },
                        {
                            nome: "Aula 34",
                            duracao: "2h",
                            conteudo: [
                                "Criar componentes reutilizáveis",
                                "Props na prática",
                                "Organizar layout em partes",
                                "Construir interface modular",
                                "Boas práticas de organização"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 18 – Estado e Interatividade",
                    aulas: [
                        {
                            nome: "Aula 35",
                            duracao: "1h30",
                            conteudo: [
                                "useState na prática",
                                "Atualizar interface dinamicamente",
                                "Eventos no React"
                            ]
                        },
                        {
                            nome: "Aula 36",
                            duracao: "2h",
                            conteudo: [
                                "Inputs controlados",
                                "Formulários completos",
                                "Validação de dados",
                                "Gerenciar múltiplos estados",
                                "Simular cadastro de usuário"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 19 – Integração com API",
                    aulas: [
                        {
                            nome: "Aula 37",
                            duracao: "1h30",
                            conteudo: [
                                "useEffect",
                                "Consumir API com fetch",
                                "Carregar dados na tela"
                            ]
                        },
                        {
                            nome: "Aula 38",
                            duracao: "2h",
                            conteudo: [
                                "Loading e tratamento de erro",
                                "Renderização condicional",
                                "Listas dinâmicas com map",
                                "Consumir API real",
                                "Simular sistema com dados reais"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 20 – Transição para Backend",
                    aulas: [
                        {
                            nome: "Aula 39",
                            duracao: "1h30",
                            conteudo: [
                                "O que é backend",
                                "Como frontend conversa com backend",
                                "Fluxo completo de aplicação",
                                "Preparação para Python"
                            ]
                        },
                        {
                            nome: "Aula 40",
                            duracao: "2h",
                            conteudo: [
                                "Introdução ao Python",
                                "Variáveis e tipos",
                                "Primeiro código em Python",
                                "Criar primeira lógica backend",
                                "Preparação para API com FastAPI"
                            ]
                        }
                    ]
                }
            ]
        }
        ,

        {
            titulo: "🔴 MÊS 6 – BACKEND (PYTHON + MYSQL)",
            semanas: [
                {
                    titulo: "Semana 21 – Python",
                    aulas: [
                        {
                            nome: "Aula 41",
                            duracao: "1h30",
                            conteudo: [
                                "Introdução ao Python",
                                "Variáveis e print",
                                "Tipos de dados"
                            ]
                        },
                        {
                            nome: "Aula 42",
                            duracao: "2h",
                            conteudo: [
                                "If e else",
                                "Funções",
                                "Listas e dicionários",
                                "Exercícios práticos",
                                "Simulação de dados reais"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 22 – FastAPI",
                    aulas: [
                        {
                            nome: "Aula 43",
                            duracao: "1h30",
                            conteudo: [
                                "Criar servidor FastAPI",
                                "Rodar API local",
                                "Primeira rota GET"
                            ]
                        },
                        {
                            nome: "Aula 44",
                            duracao: "2h",
                            conteudo: [
                                "Rotas POST",
                                "Receber dados",
                                "Validação de dados",
                                "Testar no Postman",
                                "Organizar projeto backend"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 23 – Banco de dados",
                    aulas: [
                        {
                            nome: "Aula 45",
                            duracao: "1h30",
                            conteudo: [
                                "Criar banco de dados",
                                "Criar tabelas",
                                "Tipos de dados",
                                "Relacionamentos básicos"
                            ]
                        },
                        {
                            nome: "Aula 46",
                            duracao: "2h",
                            conteudo: [
                                "Insert",
                                "Select",
                                "Update",
                                "Delete",
                                "Consultas reais",
                                "Simular sistema de usuários"
                            ]
                        }
                    ]
                },
                {
                    titulo: "Semana 24 – Integração completa",
                    aulas: [
                        {
                            nome: "Aula 47",
                            duracao: "1h30",
                            conteudo: [
                                "Conectar Python ao banco",
                                "Salvar dados via API",
                                "Buscar dados",
                                "Estrutura de resposta JSON"
                            ]
                        },
                        {
                            nome: "Aula 48",
                            duracao: "2h",
                            conteudo: [
                                "CRUD completo",
                                "Sistema de cadastro real",
                                "Login básico",
                                "Proteção de rotas (conceito)",
                                "Integração com React",
                                "Fluxo completo da aplicação",
                                "Simulação de sistema real"
                            ]
                        }
                    ]
                }
            ]
        }];

    return (
        <section className="estruturaCurso_container">

            <h2 className="estruturaCurso_titulo">
                Como você vai aprender na prática
            </h2>

            <p className="estruturaCurso_subtitulo">
                Cada aula é guiada e aplicada diretamente em projetos reais
            </p>

            <div className="estruturaCurso_lista">

                {meses.slice(0, visivel).map((mes, index) => (

                    <div key={index} className="estruturaCurso_card">

                        <h3 className="estruturaCurso_mes">
                            {mes.titulo}
                        </h3>

                        {mes.semanas.map((semana, i) => (

                            <div key={i} className="estruturaCurso_semana">

                                <h4 className="estruturaCurso_semanaTitulo">
                                    {semana.titulo}
                                </h4>

                                {semana.aulas.map((aula, j) => (

                                    <div key={j} className="estruturaCurso_aula">

                                        <div className="estruturaCurso_aulaHeader">
                                            <span className="estruturaCurso_nomeAula">
                                                {aula.nome}
                                            </span>

                                            <span className="estruturaCurso_duracao">
                                                {aula.duracao}
                                            </span>
                                        </div>

                                        <ul>
                                            {aula.conteudo.map((item, k) => (
                                                <li key={k}>{item}</li>
                                            ))}
                                        </ul>

                                    </div>

                                ))}

                            </div>

                        ))}

                    </div>

                ))}

            </div>

            {visivel < meses.length && (
                <button
                    className="estruturaCurso_botao"
                    onClick={() => setVisivel(visivel + 2)}
                >
                    Ver mais conteúdo
                </button>
            )}

        </section>
    );
}