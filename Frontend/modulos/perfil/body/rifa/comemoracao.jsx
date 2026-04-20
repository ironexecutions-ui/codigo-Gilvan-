import React, { useEffect, useRef } from "react";

export default function FogosComemoracao({ ativo }) {
    const canvasRef = useRef(null);
    const animacaoRef = useRef(null);
    const particulasRef = useRef([]);

    useEffect(() => {
        if (!ativo) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        resize();
        window.addEventListener("resize", resize);

        function criarExplosao(x, y) {
            const cores = ["#22c55e", "#38bdf8", "#facc15", "#a855f7", "#fb7185"];

            for (let i = 0; i < 120; i++) {
                const angulo = Math.random() * Math.PI * 2;
                const velocidade = Math.random() * 6 + 3;

                particulasRef.current.push({
                    x,
                    y,
                    vx: Math.cos(angulo) * velocidade,
                    vy: Math.sin(angulo) * velocidade,
                    vida: 100,
                    cor: cores[Math.floor(Math.random() * cores.length)]
                });
            }
        }

        function loop() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = particulasRef.current.length - 1; i >= 0; i--) {
                const p = particulasRef.current[i];

                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.05;
                p.vida--;

                ctx.beginPath();
                ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = p.cor;
                ctx.fill();

                if (p.vida <= 0) {
                    particulasRef.current.splice(i, 1);
                }
            }

            animacaoRef.current = requestAnimationFrame(loop);
        }

        // 🎆 EXPLOSÕES VISÍVEIS (CENTRO DA TELA)
        criarExplosao(window.innerWidth * 0.5, window.innerHeight * 0.3);
        criarExplosao(window.innerWidth * 0.3, window.innerHeight * 0.4);
        criarExplosao(window.innerWidth * 0.7, window.innerHeight * 0.4);

        loop();

        // ⏱️ Para automaticamente
        setTimeout(() => {
            cancelAnimationFrame(animacaoRef.current);
            particulasRef.current = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 5000);

        return () => {
            cancelAnimationFrame(animacaoRef.current);
            window.removeEventListener("resize", resize);
            particulasRef.current = [];
        };
    }, [ativo]);

    if (!ativo) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                pointerEvents: "none"
            }}
        />
    );
}
