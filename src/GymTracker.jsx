import { useState, useEffect } from "react";

const rutina = {
  LUNES: {
    label: "Legs 🍑",
    color: "#FF6B9D",
    ejercicios: [
      { nombre: "Hip Thrust", series: 4, reps: 15 },
      { nombre: "Sentadilla libre", series: 4, reps: 15 },
      { nombre: "Peso muerto rumano", series: 4, reps: 15 },
      { nombre: "Abductores abierto/cerrado", series: 4, reps: 15 },
      { nombre: "Gemelos", series: 3, reps: 20 },
    ],
  },
  MARTES: {
    label: "Push 💪",
    color: "#FF9A3C",
    ejercicios: [
      { nombre: "Press banca", series: 4, reps: 15 },
      { nombre: "Press militar", series: 4, reps: 15 },
      { nombre: "Elevaciones laterales", series: 4, reps: 15 },
      { nombre: "Tríceps polea", series: 4, reps: 15 },
      { nombre: "Copa/polea", series: 3, reps: 15 },
    ],
  },
  MIÉRCOLES: {
    label: "Pull 🏋️",
    color: "#4ECDC4",
    ejercicios: [
      { nombre: "Dominadas", series: 4, reps: 15 },
      { nombre: "Remo con barra", series: 4, reps: 15 },
      { nombre: "Remo en máquina", series: 4, reps: 15 },
      { nombre: "Face pull", series: 4, reps: 15 },
      { nombre: "Curl de bíceps", series: 4, reps: 15 },
    ],
  },
  JUEVES: {
    label: "Descanso 😴",
    color: "#A0A0B0",
    ejercicios: [],
  },
  VIERNES: {
    label: "Legs 2 🦵",
    color: "#C77DFF",
    ejercicios: [
      { nombre: "Sentadilla hack", series: 4, reps: 15 },
      { nombre: "Búlgara", series: 4, reps: 15 },
      { nombre: "Curl femoral", series: 4, reps: 15 },
      { nombre: "Extensión cuádriceps", series: 4, reps: 15 },
      { nombre: "Hip trust máquina", series: 3, reps: 15 },
      { nombre: "Prensa", series: 3, reps: 15 },
    ],
  },
  SÁBADO: {
    label: "Arms ✨",
    color: "#FFD93D",
    ejercicios: [
      { nombre: "Curl alterno", series: 4, reps: 15 },
      { nombre: "Tríceps overhead", series: 4, reps: 15 },
      { nombre: "Fondos", series: 3, reps: 15 },
    ],
  },
  DOMINGO: {
    label: "Descanso 🌿",
    color: "#74C69D",
    ejercicios: [],
  },
};

const DIAS = Object.keys(rutina);

function getHoy() {
  const d = ["DOMINGO","LUNES","MARTES","MIÉRCOLES","JUEVES","VIERNES","SÁBADO"];
  return d[new Date().getDay()];
}

export default function GymTracker() {
  const [diaActivo, setDiaActivo] = useState(getHoy());
  const [registros, setRegistros] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gym_registros") || "{}"); }
    catch { return {}; }
  });
  const [semana] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("gym_semana") || "null");
      return stored || getCurrentWeekKey();
    }
    catch { return getCurrentWeekKey(); }
  });

  function getCurrentWeekKey() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const lunes = new Date(d.setDate(diff));
    return lunes.toISOString().split("T")[0];
  }

  useEffect(() => {
    localStorage.setItem("gym_registros", JSON.stringify(registros));
  }, [registros]);

  useEffect(() => {
    localStorage.setItem("gym_semana", JSON.stringify(semana));
  }, [semana]);

  const diaData = rutina[diaActivo];
  const claveRegistro = (dia, ejercicio, serie, tipo = "check") => `${semana}_${dia}_${ejercicio}_${serie}_${tipo}`;

  const getPeso = (dia, ej, s) => registros[claveRegistro(dia, ej, s, "peso")] || "";

  function setPeso(dia, ej, s, val) {
    setRegistros(prev => {
      const next = { ...prev };
      const k = claveRegistro(dia, ej, s, "peso");
      if (val) next[k] = val; else delete next[k];
      return next;
    });
  }

  function toggleSerie(ejercicio, serie) {
    const clave = claveRegistro(diaActivo, ejercicio, serie, "check");
    setRegistros(prev => ({ ...prev, [clave]: !prev[clave] }));
  }

  function serieHecha(ejercicio, serie) {
    return !!registros[claveRegistro(diaActivo, ejercicio, serie, "check")];
  }

  function progresoDia(dia) {
    const ejs = rutina[dia].ejercicios;
    if (!ejs.length) return null;
    let total = 0, hechas = 0;
    ejs.forEach(e => {
      for (let s = 0; s < e.series; s++) {
        total++;
        if (registros[claveRegistro(dia, e.nombre, s, "check")]) hechas++;
      }
    });
    return { total, hechas, pct: Math.round((hechas / total) * 100) };
  }

  function diaCompletado(dia) {
    const p = progresoDia(dia);
    return p && p.hechas === p.total;
  }

  const hoy = getHoy();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'DM Sans', sans-serif",
      color: "#f0f0f5",
      padding: "0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,500;0,700;1,300&family=Space+Mono:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

        .dia-btn {
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
          outline: none;
        }
        .dia-btn:hover { transform: translateY(-2px); }

        .serie-circle {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 2px solid currentColor;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700;
          transition: all 0.15s ease;
          font-family: 'Space Mono', monospace;
          flex-shrink: 0;
        }
        .serie-circle:hover { transform: scale(1.1); }
        .serie-circle.hecha { color: #0a0a0f !important; }

        .ejercicio-card {
          background: #14141c;
          border-radius: 16px;
          padding: 18px 20px;
          margin-bottom: 12px;
          border: 1px solid #1e1e2e;
          transition: border-color 0.2s;
        }
        .ejercicio-card:hover { border-color: #2e2e4e; }

        .progress-bar-track {
          height: 4px;
          background: #1e1e2e;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 6px;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
        }

        .tag {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .hoy-dot {
          animation: pulse 2s infinite;
        }

        .peso-input {
          width: 72px;
          border: 0.5px solid #333;
          border-radius: 8px;
          padding: 5px 8px;
          font-size: 13px;
          background: #1e1e2e;
          color: #f0f0f5;
          text-align: center;
          outline: none;
        }
        .peso-input:focus { border-color: #666; }
        .peso-input::placeholder { color: #444; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "32px 24px 20px",
        borderBottom: "1px solid #1a1a2e",
        position: "sticky", top: 0,
        background: "#0a0a0f",
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "22px", fontWeight: 700, color: diaData.color }}>
            XIME
          </span>
          <span style={{ fontSize: "13px", color: "#666", letterSpacing: "2px", textTransform: "uppercase" }}>
            gym tracker
          </span>
        </div>
        <p style={{ fontSize: "12px", color: "#444", letterSpacing: "1px" }}>
          Semana del {semana}
        </p>
      </div>

      {/* Días nav */}
      <div style={{
        display: "flex",
        gap: "8px",
        padding: "16px 24px",
        overflowX: "auto",
        borderBottom: "1px solid #1a1a2e",
      }}>
        {DIAS.map(dia => {
          const esActivo = dia === diaActivo;
          const esHoy = dia === hoy;
          const prog = progresoDia(dia);
          const completado = diaCompletado(dia);
          const color = rutina[dia].color;

          return (
            <button
              key={dia}
              className="dia-btn"
              onClick={() => setDiaActivo(dia)}
              style={{
                background: esActivo ? color : "#14141c",
                color: esActivo ? "#0a0a0f" : color,
                padding: "10px 14px",
                borderRadius: "12px",
                minWidth: "fit-content",
                border: esHoy && !esActivo ? `2px solid ${color}` : "2px solid transparent",
              }}
            >
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", fontWeight: 700, letterSpacing: "1px" }}>
                {dia.slice(0, 3)}
              </div>
              {prog !== null && (
                <div style={{ fontSize: "10px", marginTop: "3px", opacity: 0.8 }}>
                  {completado ? "✓" : `${prog.hechas}/${prog.total}`}
                </div>
              )}
              {esHoy && (
                <div className="hoy-dot" style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: esActivo ? "#0a0a0f" : color,
                  margin: "3px auto 0",
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      <div style={{ padding: "24px", maxWidth: 600, margin: "0 auto" }}>
        {/* Header del día */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "28px", fontWeight: 700,
                color: diaData.color, lineHeight: 1,
              }}>
                {diaActivo}
              </h1>
              <p style={{ color: "#666", fontSize: "14px", marginTop: "4px" }}>{diaData.label}</p>
            </div>
            {progresoDia(diaActivo) && (
              <div style={{ textAlign: "right" }}>
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "32px", fontWeight: 700, color: diaData.color,
                }}>
                  {progresoDia(diaActivo).pct}%
                </span>
                <p style={{ fontSize: "11px", color: "#444" }}>completado</p>
              </div>
            )}
          </div>
          {progresoDia(diaActivo) && (
            <div className="progress-bar-track" style={{ marginTop: "14px" }}>
              <div className="progress-bar-fill" style={{
                width: `${progresoDia(diaActivo).pct}%`,
                background: diaData.color,
              }} />
            </div>
          )}
        </div>

        {/* Ejercicios */}
        {diaData.ejercicios.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: "#333",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>
              {diaActivo === "JUEVES" ? "💤" : "🌿"}
            </div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "14px", letterSpacing: "1px" }}>
              DÍA DE DESCANSO
            </p>
            <p style={{ fontSize: "12px", marginTop: "8px", color: "#2a2a3a" }}>
              Recarga energía para mañana 💪
            </p>
          </div>
        ) : (
          diaData.ejercicios.map((ej, i) => {
            const seriesHechas = Array.from({ length: ej.series }).filter((_, s) => serieHecha(ej.nombre, s)).length;
            const ejCompleto = seriesHechas === ej.series;

            return (
              <div key={i} className="ejercicio-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div>
                    <p style={{
                      fontSize: "15px", fontWeight: 500,
                      color: ejCompleto ? diaData.color : "#e0e0f0",
                      transition: "color 0.2s",
                    }}>
                      {ejCompleto && "✓ "}{ej.nombre}
                    </p>
                    <p style={{ fontSize: "12px", color: "#555", marginTop: "3px" }}>
                      {ej.series} series × {ej.reps} reps
                    </p>
                  </div>
                  <span className="tag" style={{
                    background: ejCompleto ? diaData.color + "22" : "#1a1a2e",
                    color: ejCompleto ? diaData.color : "#444",
                  }}>
                    {seriesHechas}/{ej.series}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {Array.from({ length: ej.series }).map((_, s) => {
                    const hecha = serieHecha(ej.nombre, s);
                    const peso = getPeso(diaActivo, ej.nombre, s);
                    return (
                      <div key={s} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                          className={`serie-circle ${hecha ? "hecha" : ""}`}
                          onClick={() => toggleSerie(ej.nombre, s)}
                          style={{
                            color: hecha ? "#0a0a0f" : diaData.color,
                            background: hecha ? diaData.color : "transparent",
                            borderColor: diaData.color,
                          }}
                        >
                          {s + 1}
                        </button>
                        <input
                          className="peso-input"
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="kg"
                          value={peso}
                          onChange={e => setPeso(diaActivo, ej.nombre, s, e.target.value)}
                          style={hecha ? { borderColor: diaData.color + "50" } : {}}
                        />
                        {peso && (
                          <span style={{ fontSize: 12, color: "#888" }}>
                            {parseFloat(peso).toFixed(1)} kg
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Resumen semanal */}
        <div style={{
          marginTop: "32px",
          background: "#14141c",
          borderRadius: "16px",
          padding: "20px",
          border: "1px solid #1e1e2e",
        }}>
          <p style={{
            fontFamily: "'Space Mono', monospace", fontSize: "11px",
            letterSpacing: "2px", color: "#444", marginBottom: "14px",
            textTransform: "uppercase",
          }}>
            Resumen semanal
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
            {DIAS.map(dia => {
              const prog = progresoDia(dia);
              const comp = diaCompletado(dia);
              const color = rutina[dia].color;
              return (
                <div key={dia} style={{ textAlign: "center" }}>
                  <div style={{
                    width: "100%", aspectRatio: "1",
                    borderRadius: "8px",
                    background: comp ? color : prog === null ? "#1e1e2e" : `${color}22`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px", marginBottom: "4px",
                  }}>
                    {comp ? "✓" : prog === null ? "" : prog.hechas > 0 ? "·" : ""}
                  </div>
                  <span style={{ fontSize: "8px", color: "#333", fontFamily: "'Space Mono', monospace" }}>
                    {dia.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "11px", color: "#222", marginTop: "32px", letterSpacing: "1px" }}>
          tu progreso se guarda automáticamente ✦
        </p>
      </div>
    </div>
  );
}
