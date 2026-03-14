import { useState, useEffect, useRef } from "react";

const RUTINA_DEFAULT = {
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

const DIAS = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];
const COLORES_PRESET = ["#FF6B9D", "#FF9A3C", "#4ECDC4", "#A0A0B0", "#C77DFF", "#FFD93D", "#74C69D", "#F87171", "#60A5FA", "#34D399"];

function getHoy() {
  const d = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
  return d[new Date().getDay()];
}

function getCurrentWeekKey() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const lunes = new Date(now.getFullYear(), now.getMonth(), diff);
  return lunes.toISOString().split("T")[0];
}

function getWeeksBefore(baseWeekKey, n) {
  const weeks = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(baseWeekKey + "T12:00:00");
    d.setDate(d.getDate() - i * 7);
    weeks.push(d.toISOString().split("T")[0]);
  }
  return weeks;
}

function getMaxPeso(registros, weekKey, ejercicioNombre) {
  let max = null;
  for (const [key, val] of Object.entries(registros)) {
    if (
      key.startsWith(weekKey + "_") &&
      key.includes("_" + ejercicioNombre + "_") &&
      key.endsWith("_peso")
    ) {
      const num = parseFloat(val);
      if (!isNaN(num) && (max === null || num > max)) max = num;
    }
  }
  return max;
}

function calcularStreak(registros, rutina) {
  const semanaActual = getCurrentWeekKey();
  let streak = 0;
  let weekKey = semanaActual;
  const diasEntrenamiento = DIAS.filter((d) => rutina[d]?.ejercicios?.length > 0);

  for (let i = 0; i < 104; i++) {
    const diasCompletados = diasEntrenamiento.filter((dia) => {
      const ejs = rutina[dia]?.ejercicios || [];
      let total = 0, done = 0;
      ejs.forEach((e) => {
        for (let s = 0; s < e.series; s++) {
          total++;
          if (registros[`${weekKey}_${dia}_${e.nombre}_${s}_check`]) done++;
        }
      });
      return total > 0 && done === total;
    });
    if (diasCompletados.length >= 3) {
      streak++;
    } else {
      // Si es la semana actual, puede estar en progreso — no romper racha
      if (i === 0) { weekKey = new Date(weekKey + "T12:00:00"); weekKey.setDate(weekKey.getDate() - 7); weekKey = weekKey.toISOString().split("T")[0]; continue; }
      break;
    }
    const d = new Date(weekKey + "T12:00:00");
    d.setDate(d.getDate() - 7);
    weekKey = d.toISOString().split("T")[0];
  }
  return streak;
}

function Sparkline({ values, color }) {
  const nonNull = values.filter((v) => v !== null);
  if (nonNull.length < 2) {
    return (
      <span style={{ fontSize: 11, color: "#444", fontFamily: "'Space Mono', monospace" }}>
        {nonNull.length === 1 ? nonNull[0] + "kg" : "—"}
      </span>
    );
  }
  const w = 80, h = 28;
  const min = Math.min(...nonNull);
  const max = Math.max(...nonNull);
  const range = max - min || 1;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: v === null ? null : h - ((v - min) / range) * (h - 6) - 3,
    v,
  }));
  const valid = pts.filter((p) => p.y !== null);
  const d = valid.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = valid[valid.length - 1];
  const prev = valid[valid.length - 2];
  const trend = last.v > prev.v ? "↑" : last.v < prev.v ? "↓" : "—";
  const trendColor = trend === "↑" ? "#4ade80" : trend === "↓" ? "#f87171" : "#555";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <svg width={w} height={h}>
        <path d={d} fill="none" stroke={color + "50"} strokeWidth={1} />
        <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {last && <circle cx={last.x} cy={last.y} r={2.5} fill={color} />}
      </svg>
      <span style={{ fontSize: 11, color: trendColor, fontFamily: "'Space Mono', monospace", minWidth: 14 }}>
        {trend}
      </span>
    </div>
  );
}

function HistorialView({ rutina, registros, semana }) {
  const weeks = getWeeksBefore(semana, 8);
  const [semanaIdx, setSemanaIdx] = useState(weeks.length - 1);
  const semanaActual = weeks[semanaIdx];

  return (
    <div style={{ padding: "24px", maxWidth: 600, margin: "0 auto" }}>
      {/* Navegación de semanas */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <button
          onClick={() => semanaIdx > 0 && setSemanaIdx((i) => i - 1)}
          style={{
            background: "none", border: "1px solid #1e1e2e", borderRadius: 8,
            color: semanaIdx > 0 ? "#888" : "#333",
            cursor: semanaIdx > 0 ? "pointer" : "default",
            padding: "6px 14px", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
          }}
        >← anterior</button>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 10, color: "#555", fontFamily: "'Space Mono', monospace", letterSpacing: 1, textTransform: "uppercase" }}>
            {semanaActual === semana ? "esta semana" : "semana del"}
          </p>
          <p style={{ fontSize: 13, color: "#ccc", fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
            {semanaActual}
          </p>
        </div>
        <button
          onClick={() => semanaIdx < weeks.length - 1 && setSemanaIdx((i) => i + 1)}
          style={{
            background: "none", border: "1px solid #1e1e2e", borderRadius: 8,
            color: semanaIdx < weeks.length - 1 ? "#888" : "#333",
            cursor: semanaIdx < weeks.length - 1 ? "pointer" : "default",
            padding: "6px 14px", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
          }}
        >siguiente →</button>
      </div>

      {/* Grid de días completados */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 2, color: "#444", marginBottom: 10, textTransform: "uppercase" }}>
          Completado esa semana
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {DIAS.map((dia) => {
            const ejs = rutina[dia]?.ejercicios || [];
            const color = rutina[dia]?.color || "#888";
            if (!ejs.length) return (
              <div key={dia} style={{ textAlign: "center" }}>
                <div style={{ width: "100%", aspectRatio: "1", borderRadius: 8, background: "#1e1e2e" }} />
                <span style={{ fontSize: 8, color: "#333", fontFamily: "'Space Mono', monospace" }}>{dia.slice(0, 3)}</span>
              </div>
            );
            let total = 0, done = 0;
            ejs.forEach((e) => {
              for (let s = 0; s < e.series; s++) {
                total++;
                if (registros[`${semanaActual}_${dia}_${e.nombre}_${s}_check`]) done++;
              }
            });
            const pct = total ? done / total : 0;
            return (
              <div key={dia} style={{ textAlign: "center" }}>
                <div style={{
                  width: "100%", aspectRatio: "1", borderRadius: 8,
                  background: pct === 1 ? color : pct > 0 ? color + "33" : "#14141c",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: pct === 1 ? "#0a0a0f" : color,
                  fontFamily: "'Space Mono', monospace",
                }}>
                  {pct === 1 ? "✓" : pct > 0 ? Math.round(pct * 100) + "%" : ""}
                </div>
                <span style={{ fontSize: 8, color: "#333", fontFamily: "'Space Mono', monospace" }}>{dia.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sparklines por ejercicio */}
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 2, color: "#444", marginBottom: 12, textTransform: "uppercase" }}>
        Progresión de peso (8 semanas)
      </p>
      {DIAS.filter((d) => rutina[d]?.ejercicios?.length > 0).map((dia) => {
        const color = rutina[dia].color;
        return (
          <div key={dia} style={{ background: "#14141c", borderRadius: 12, padding: "14px 16px", marginBottom: 10, border: "1px solid #1e1e2e" }}>
            <p style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
              {dia} — {rutina[dia].label}
            </p>
            {rutina[dia].ejercicios.map((ej) => {
              const vals = weeks.map((w) => getMaxPeso(registros, w, ej.nombre));
              const lastVal = vals.filter((v) => v !== null).slice(-1)[0];
              return (
                <div key={ej.nombre} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid #1a1a2a",
                }}>
                  <div>
                    <p style={{ fontSize: 13, color: "#c0c0d0" }}>{ej.nombre}</p>
                    <p style={{ fontSize: 11, color: "#444", marginTop: 1 }}>
                      {lastVal != null ? lastVal + " kg max" : "sin datos"}
                    </p>
                  </div>
                  <Sparkline values={vals} color={color} />
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Notas de esa semana */}
      {(() => {
        const notes = DIAS
          .filter((d) => rutina[d]?.ejercicios?.length > 0)
          .map((d) => ({ dia: d, nota: registros[`${semanaActual}_${d}_nota`] }))
          .filter((x) => x.nota);
        if (!notes.length) return null;
        return (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 2, color: "#444", marginBottom: 10, textTransform: "uppercase" }}>
              Notas de esa semana
            </p>
            {notes.map(({ dia, nota }) => (
              <div key={dia} style={{ background: "#14141c", borderRadius: 10, padding: "10px 14px", marginBottom: 8, border: "1px solid #1e1e2e" }}>
                <p style={{ fontSize: 9, color: rutina[dia]?.color, fontFamily: "'Space Mono', monospace", letterSpacing: 1, marginBottom: 4 }}>
                  {dia}
                </p>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>{nota}</p>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

function RutinaEditor({ rutinaEdit, onChange, onSave, onCancel }) {
  const firstActiveDay = DIAS.find((d) => rutinaEdit[d]?.ejercicios?.length > 0) || DIAS[0];
  const [diaEdicion, setDiaEdicion] = useState(firstActiveDay);

  function updateEjercicio(idx, campo, valor) {
    onChange((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (campo === "nombre") {
        next[diaEdicion].ejercicios[idx].nombre = valor;
      } else {
        next[diaEdicion].ejercicios[idx][campo] = Math.max(1, parseInt(valor) || 1);
      }
      return next;
    });
  }

  function updateDia(campo, valor) {
    onChange((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[diaEdicion][campo] = valor;
      return next;
    });
  }

  function addEjercicio() {
    onChange((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[diaEdicion].ejercicios.push({ nombre: "Nuevo ejercicio", series: 3, reps: 12 });
      return next;
    });
  }

  function removeEjercicio(idx) {
    onChange((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[diaEdicion].ejercicios.splice(idx, 1);
      return next;
    });
  }

  function toggleDescanso() {
    onChange((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (next[diaEdicion].ejercicios.length > 0) {
        next[diaEdicion]._saved = next[diaEdicion].ejercicios;
        next[diaEdicion].ejercicios = [];
      } else {
        next[diaEdicion].ejercicios = next[diaEdicion]._saved || RUTINA_DEFAULT[diaEdicion]?.ejercicios || [];
        delete next[diaEdicion]._saved;
      }
      return next;
    });
  }

  const dia = rutinaEdit[diaEdicion];
  const esDescanso = dia?.ejercicios?.length === 0;
  const color = dia?.color || "#888";

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Selector de día */}
      <div style={{ display: "flex", gap: 6, padding: "12px 24px", overflowX: "auto", borderBottom: "1px solid #1a1a2e" }}>
        {DIAS.map((d) => {
          const isActive = d === diaEdicion;
          const c = rutinaEdit[d]?.color || "#888";
          return (
            <button
              key={d}
              onClick={() => setDiaEdicion(d)}
              style={{
                background: isActive ? c : "#14141c",
                color: isActive ? "#0a0a0f" : c,
                border: "2px solid transparent",
                borderRadius: 10, padding: "8px 12px",
                cursor: "pointer", minWidth: "fit-content",
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                fontWeight: 700, letterSpacing: 1,
              }}
            >
              {d.slice(0, 3)}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "20px 24px", maxWidth: 600, margin: "0 auto" }}>
        {/* Nombre del día y color */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <p style={{ fontSize: 10, color: "#555", fontFamily: "'Space Mono', monospace", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
                {diaEdicion}
              </p>
              <input
                value={dia?.label || ""}
                onChange={(e) => updateDia("label", e.target.value)}
                placeholder="Nombre del día (ej: Legs 🍑)"
                style={{
                  width: "100%", background: "#1e1e2e", border: "1px solid #333",
                  borderRadius: 8, color: "#f0f0f5", padding: "8px 10px",
                  fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: "none",
                }}
              />
            </div>
            <button
              onClick={toggleDescanso}
              style={{
                background: esDescanso ? "#1e1e2e" : "transparent",
                border: "1px solid " + (esDescanso ? "#555" : "#2a2a3a"),
                borderRadius: 10, padding: "8px 14px",
                color: esDescanso ? "#f0f0f5" : "#555",
                fontSize: 12, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
              }}
            >
              {esDescanso ? "😴 descanso" : "marcar descanso"}
            </button>
          </div>
          {/* Color picker */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLORES_PRESET.map((c) => (
              <button
                key={c}
                onClick={() => updateDia("color", c)}
                style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: c, cursor: "pointer",
                  border: dia?.color === c ? "2px solid #fff" : "2px solid transparent",
                  outline: dia?.color === c ? "2px solid " + c + "66" : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>

        {esDescanso ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#333" }}>
            <p style={{ fontSize: 40, marginBottom: 10 }}>😴</p>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: 1 }}>DÍA DE DESCANSO</p>
          </div>
        ) : (
          <>
            {dia?.ejercicios?.map((ej, idx) => (
              <div key={idx} style={{ background: "#14141c", borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: "1px solid #1e1e2e" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input
                    value={ej.nombre}
                    onChange={(e) => updateEjercicio(idx, "nombre", e.target.value)}
                    style={{
                      flex: 1, background: "#1e1e2e", border: "1px solid #333",
                      borderRadius: 8, color: "#f0f0f5", padding: "7px 10px",
                      fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none",
                    }}
                  />
                  <button
                    onClick={() => removeEjercicio(idx)}
                    style={{
                      background: "none", border: "1px solid #2a1a1a",
                      borderRadius: 8, color: "#663333", cursor: "pointer",
                      padding: "7px 10px", fontSize: 13,
                    }}
                  >✕</button>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#555" }}>series</span>
                    <input
                      type="number" min="1" max="10"
                      value={ej.series}
                      onChange={(e) => updateEjercicio(idx, "series", e.target.value)}
                      style={{
                        width: 52, background: "#1e1e2e", border: "1px solid #333",
                        borderRadius: 8, color: "#f0f0f5", padding: "5px",
                        fontSize: 13, fontFamily: "'Space Mono', monospace",
                        textAlign: "center", outline: "none",
                      }}
                    />
                  </div>
                  <span style={{ color: "#333" }}>×</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#555" }}>reps</span>
                    <input
                      type="number" min="1" max="100"
                      value={ej.reps}
                      onChange={(e) => updateEjercicio(idx, "reps", e.target.value)}
                      style={{
                        width: 52, background: "#1e1e2e", border: "1px solid #333",
                        borderRadius: 8, color: "#f0f0f5", padding: "5px",
                        fontSize: 13, fontFamily: "'Space Mono', monospace",
                        textAlign: "center", outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={addEjercicio}
              style={{
                width: "100%", background: "none",
                border: "1px dashed " + color + "44",
                borderRadius: 12, padding: "12px",
                color: color + "88", cursor: "pointer",
                fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                marginTop: 4, marginBottom: 20,
              }}
            >+ agregar ejercicio</button>
          </>
        )}

        {/* Guardar / Cancelar */}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, background: "none", border: "1px solid #1e1e2e",
              borderRadius: 12, padding: "12px",
              color: "#555", cursor: "pointer", fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >cancelar</button>
          <button
            onClick={onSave}
            style={{
              flex: 2, background: color, border: "none",
              borderRadius: 12, padding: "12px",
              color: "#0a0a0f", cursor: "pointer", fontSize: 13,
              fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
            }}
          >guardar rutina</button>
        </div>
      </div>
    </div>
  );
}

export default function GymTracker() {
  const [rutina, setRutina] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gym_rutina") || "null") || RUTINA_DEFAULT; }
    catch { return RUTINA_DEFAULT; }
  });
  const [diaActivo, setDiaActivo] = useState(getHoy());
  const [registros, setRegistros] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gym_registros") || "{}"); }
    catch { return {}; }
  });

  // Bug fix: semana siempre es la semana actual, nunca la del localStorage
  const semana = getCurrentWeekKey();

  const [vista, setVista] = useState("tracker");
  const [timer, setTimer] = useState(null);
  const [timerDuracion, setTimerDuracion] = useState(90); // recuerda la duración elegida
  const [timerEnabled, setTimerEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gym_timer_enabled") ?? "true"); }
    catch { return true; }
  });
  const [rutinaEdit, setRutinaEdit] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmarLimpiar, setConfirmarLimpiar] = useState(false);
  const hoyBtnRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("gym_registros", JSON.stringify(registros));
  }, [registros]);

  useEffect(() => {
    localStorage.setItem("gym_rutina", JSON.stringify(rutina));
  }, [rutina]);

  useEffect(() => {
    localStorage.setItem("gym_timer_enabled", JSON.stringify(timerEnabled));
  }, [timerEnabled]);

  useEffect(() => {
    if (!timer || timer.restantes <= 0) return;
    const id = setTimeout(() => {
      setTimer((t) => {
        if (!t || t.restantes <= 1) {
          try { navigator.vibrate?.([200, 100, 200]); } catch {}
          return null;
        }
        return { ...t, restantes: t.restantes - 1 };
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [timer]);

  // Auto-cerrar toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  // Auto-scroll al día de hoy al abrir
  useEffect(() => {
    hoyBtnRef.current?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  }, []);

  function mostrarToast(msg) {
    setToast(msg);
  }

  const diaData = rutina[diaActivo];
  const claveRegistro = (dia, ejercicio, serie, tipo = "check") =>
    `${semana}_${dia}_${ejercicio}_${serie}_${tipo}`;

  const getPeso = (dia, ej, s) => registros[claveRegistro(dia, ej, s, "peso")] || "";

  const getPesoAnterior = (dia, ejNombre, s) => {
    const semAnt = getWeeksBefore(1)[0];
    return registros[`${semAnt}_${dia}_${ejNombre}_${s}_peso`] || null;
  };

  function setPeso(dia, ej, s, val) {
    setRegistros((prev) => {
      const next = { ...prev };
      const k = claveRegistro(dia, ej, s, "peso");
      if (val) next[k] = val; else delete next[k];
      return next;
    });
  }

  function toggleSerie(ejercicio, totalSeries, clickedIdx) {
    const allDoneUpTo = Array.from({ length: clickedIdx + 1 }, (_, s) => s)
      .every((s) => registros[claveRegistro(diaActivo, ejercicio, s, "check")]);
    setRegistros((prev) => {
      const next = { ...prev };
      if (allDoneUpTo) {
        for (let s = clickedIdx; s < totalSeries; s++) {
          delete next[claveRegistro(diaActivo, ejercicio, s, "check")];
        }
      } else {
        for (let s = 0; s <= clickedIdx; s++) {
          next[claveRegistro(diaActivo, ejercicio, s, "check")] = true;
        }
        for (let s = clickedIdx + 1; s < totalSeries; s++) {
          delete next[claveRegistro(diaActivo, ejercicio, s, "check")];
        }
        if (timerEnabled) setTimer({ restantes: timerDuracion, duracion: timerDuracion });
      }
      return next;
    });
  }

  function completarTodoEjercicio(ejercicio, totalSeries, estaCompleto) {
    setRegistros((prev) => {
      const next = { ...prev };
      if (estaCompleto) {
        for (let s = 0; s < totalSeries; s++) {
          delete next[claveRegistro(diaActivo, ejercicio, s, "check")];
        }
      } else {
        for (let s = 0; s < totalSeries; s++) {
          next[claveRegistro(diaActivo, ejercicio, s, "check")] = true;
        }
        if (timerEnabled) setTimer({ restantes: timerDuracion, duracion: timerDuracion });
      }
      return next;
    });
  }

  function serieHecha(ejercicio, serie) {
    return !!registros[claveRegistro(diaActivo, ejercicio, serie, "check")];
  }

  function progresoDia(dia) {
    const ejs = rutina[dia]?.ejercicios || [];
    if (!ejs.length) return null;
    let total = 0, hechas = 0;
    ejs.forEach((e) => {
      for (let s = 0; s < e.series; s++) {
        total++;
        if (registros[claveRegistro(dia, e.nombre, s)]) hechas++;
      }
    });
    return { total, hechas, pct: Math.round((hechas / total) * 100) };
  }

  function diaCompletado(dia) {
    const p = progresoDia(dia);
    return p && p.hechas === p.total;
  }

  function getNota(dia) {
    return registros[`${semana}_${dia}_nota`] || "";
  }

  function setNota(dia, val) {
    setRegistros((prev) => {
      const next = { ...prev };
      const k = `${semana}_${dia}_nota`;
      if (val) next[k] = val; else delete next[k];
      return next;
    });
  }

  function limpiarSemana() {
    setRegistros((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(semana + "_")) delete next[k];
      });
      return next;
    });
    setConfirmarLimpiar(false);
    mostrarToast("Semana limpiada");
  }

  // 1RM estimado (Epley): peso × (1 + reps/30)
  function calcular1RM(ejercicio, totalSeries, reps) {
    let max1rm = null;
    for (let s = 0; s < totalSeries; s++) {
      const peso = parseFloat(registros[claveRegistro(diaActivo, ejercicio, s, "peso")]);
      if (!isNaN(peso) && peso > 0) {
        const rm = peso * (1 + reps / 30);
        if (max1rm === null || rm > max1rm) max1rm = rm;
      }
    }
    return max1rm;
  }

  function propagarPeso(dia, ejNombre, desde, totalSeries, valor) {
    setRegistros((prev) => {
      const next = { ...prev };
      for (let s = desde + 1; s < totalSeries; s++) {
        const k = claveRegistro(dia, ejNombre, s, "peso");
        if (valor) next[k] = valor; else delete next[k];
      }
      return next;
    });
  }

  function volumenDia(dia) {
    const ejs = rutina[dia]?.ejercicios || [];
    let vol = 0;
    ejs.forEach(e => {
      for (let s = 0; s < e.series; s++) {
        if (registros[claveRegistro(dia, e.nombre, s, "check")]) {
          const p = parseFloat(registros[claveRegistro(dia, e.nombre, s, "peso")]);
          if (!isNaN(p) && p > 0) vol += p * e.reps;
        }
      }
    });
    return vol > 0 ? vol : null;
  }

  function generarTextoResumen() {
    const emojisEstado = { completado: "✅", parcial: "⏳", descanso: "😴" };
    const lineas = DIAS.map(dia => {
      const prog = progresoDia(dia);
      const label = rutina[dia]?.label || "";
      const nombre = dia.charAt(0) + dia.slice(1).toLowerCase();
      if (!prog) return `${emojisEstado.descanso} ${nombre.toUpperCase()} – Descanso`;
      const pct = prog.pct;
      const icono = pct === 100 ? emojisEstado.completado : emojisEstado.parcial;
      return `${icono} ${nombre.toUpperCase()} – ${label} (${pct}%)`;
    });

    const volSemana = DIAS.reduce((acc, dia) => {
      const v = volumenDia(dia);
      return acc + (v || 0);
    }, 0);
    const streak = calcularStreak(registros, rutina);

    let texto = `XIME Gym Tracker 💪\nSemana del ${semana}\n\n${lineas.join("\n")}`;
    if (streak > 0) texto += `\n\n🔥 ${streak} ${streak === 1 ? "semana" : "semanas"} consecutivas`;
    if (volSemana > 0) texto += `\n💪 Total: ${volSemana.toLocaleString("es")} kg movidos esta semana`;
    return texto;
  }

  async function compartirResumen() {
    const texto = generarTextoResumen();
    if (navigator.share) {
      try { await navigator.share({ title: "XIME Gym Tracker", text: texto }); } catch {}
    } else {
      await navigator.clipboard.writeText(texto);
      mostrarToast("Copiado al portapapeles ✓");
    }
  }

  const hoy = getHoy();
  const progDiaActivo = progresoDia(diaActivo);
  const streak = calcularStreak(registros, rutina);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'DM Sans', sans-serif", color: "#f0f0f5" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,500;0,700;1,300&family=Space+Mono:wght@700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .dia-btn { transition: all 0.2s ease; cursor: pointer; border: none; outline: none; }
        .dia-btn:hover { transform: translateY(-2px); }
        .serie-circle {
          width: 36px; height: 36px; border-radius: 50%;
          border: 2px solid currentColor; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700;
          transition: all 0.15s ease;
          font-family: 'Space Mono', monospace; flex-shrink: 0;
        }
        .serie-circle:hover { transform: scale(1.1); }
        .serie-circle.hecha { color: #0a0a0f !important; }
        .ejercicio-card {
          background: #14141c; border-radius: 16px;
          padding: 18px 20px; margin-bottom: 12px;
          border: 1px solid #1e1e2e; transition: border-color 0.2s;
        }
        .ejercicio-card:hover { border-color: #2e2e4e; }
        .progress-bar-track { height: 4px; background: #1e1e2e; border-radius: 2px; overflow: hidden; margin-top: 6px; }
        .progress-bar-fill { height: 100%; border-radius: 2px; transition: width 0.4s cubic-bezier(0.4,0,0.2,1); }
        .tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .hoy-dot { animation: pulse 2s infinite; }
        @keyframes timerPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        .timer-urgente { animation: timerPulse 0.6s ease infinite; }
        .peso-input {
          width: 72px; border: 0.5px solid #333; border-radius: 8px;
          padding: 5px 8px; font-size: 13px; background: #1e1e2e;
          color: #f0f0f5; text-align: center; outline: none;
        }
        .peso-input:focus { border-color: #666; }
        .peso-input::placeholder { color: #444; }
        .nota-textarea {
          width: 100%; background: #14141c; border: 1px solid #1e1e2e;
          border-radius: 12px; color: #f0f0f5; padding: 12px 14px;
          font-size: 13px; font-family: 'DM Sans', sans-serif;
          outline: none; resize: vertical; min-height: 70px; line-height: 1.5;
        }
        .nota-textarea:focus { border-color: #333; }
        .nota-textarea::placeholder { color: #333; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .timer-panel { animation: slideUp 0.3s ease; }
        .icon-btn {
          background: #14141c; border: 1px solid #1e1e2e;
          border-radius: 10px; color: #888; cursor: pointer;
          padding: 7px 11px; font-size: 15px;
          transition: all 0.15s; line-height: 1;
        }
        .icon-btn:hover { background: #1e1e2e; border-color: #333; }
        .icon-btn.active { background: #1e1e2e; border-color: #555; color: #f0f0f5; }
        @keyframes toastIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .toast { animation: toastIn 0.25s ease; }
        .completar-btn {
          background: none; border: none; cursor: pointer;
          font-size: 11px; font-family: 'Space Mono', monospace;
          letter-spacing: 0.5px; padding: 3px 8px;
          border-radius: 6px; transition: all 0.15s;
        }
        .completar-btn:hover { background: #1e1e2e; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: "#1e1e2e", border: "1px solid #333",
          borderRadius: 10, padding: "10px 18px",
          fontSize: 13, color: "#f0f0f5", zIndex: 200,
          fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.3,
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: "28px 24px 16px",
        borderBottom: "1px solid #1a1a2e",
        position: "sticky", top: 0,
        background: "#0a0a0f", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 2 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: diaData?.color || "#fff" }}>
                XIME
              </span>
              <span style={{ fontSize: 13, color: "#666", letterSpacing: 2, textTransform: "uppercase" }}>
                gym tracker
              </span>
              {streak > 0 && (
                <span style={{
                  fontSize: 12, color: "#f0f0f5",
                  background: "#1e1e2e", borderRadius: 20,
                  padding: "2px 8px", letterSpacing: 0.5,
                }}>
                  🔥 {streak}
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: "#444", letterSpacing: 1 }}>Semana del {semana}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={"icon-btn" + (vista === "historial" ? " active" : "")}
              onClick={() => setVista((v) => v === "historial" ? "tracker" : "historial")}
              title="Historial"
            ><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></button>
            <button
              className={"icon-btn" + (vista === "editor" ? " active" : "")}
              onClick={() => {
                if (vista === "editor") {
                  setVista("tracker");
                  setRutinaEdit(null);
                } else {
                  setRutinaEdit(JSON.parse(JSON.stringify(rutina)));
                  setVista("editor");
                }
              }}
              title="Editar rutina"
            ><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
          </div>
        </div>
      </div>

      {/* Vista: Historial */}
      {vista === "historial" && (
        <HistorialView rutina={rutina} registros={registros} semana={semana} />
      )}

      {/* Vista: Editor */}
      {vista === "editor" && rutinaEdit && (
        <RutinaEditor
          rutinaEdit={rutinaEdit}
          onChange={setRutinaEdit}
          onSave={() => {
            const clean = JSON.parse(JSON.stringify(rutinaEdit));
            DIAS.forEach((d) => { if (clean[d]) delete clean[d]._saved; });
            setRutina(clean);
            setVista("tracker");
            setRutinaEdit(null);
            mostrarToast("Rutina guardada ✓");
          }}
          onCancel={() => {
            setVista("tracker");
            setRutinaEdit(null);
          }}
        />
      )}

      {/* Vista: Tracker */}
      {vista === "tracker" && (
        <>
          {/* Navegación de días */}
          <div style={{ display: "flex", gap: 8, padding: "16px 24px", overflowX: "auto", borderBottom: "1px solid #1a1a2e" }}>
            {DIAS.map((dia) => {
              const esActivo = dia === diaActivo;
              const esHoy = dia === hoy;
              const prog = progresoDia(dia);
              const completado = diaCompletado(dia);
              const color = rutina[dia]?.color || "#888";
              return (
                <button
                  key={dia}
                  ref={esHoy ? hoyBtnRef : null}
                  className="dia-btn"
                  onClick={() => setDiaActivo(dia)}
                  style={{
                    background: esActivo ? color : "#14141c",
                    color: esActivo ? "#0a0a0f" : color,
                    padding: "10px 14px", borderRadius: 12, minWidth: "fit-content",
                    border: esHoy && !esActivo ? `2px solid ${color}` : "2px solid transparent",
                  }}
                >
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                    {dia.slice(0, 3)}
                  </div>
                  {prog !== null && (
                    <div style={{ fontSize: 10, marginTop: 3, opacity: 0.8 }}>
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

          {/* Contenido del día */}
          <div style={{ padding: 24, maxWidth: 600, margin: "0 auto", paddingBottom: timer ? 120 : 24 }}>
            {/* Encabezado del día */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: diaData?.color, lineHeight: 1 }}>
                    {diaActivo}
                  </h1>
                  <p style={{ color: "#666", fontSize: 14, marginTop: 4 }}>{diaData?.label}</p>
                </div>
                {progDiaActivo && (
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 32, fontWeight: 700, color: diaData?.color }}>
                      {progDiaActivo.pct}%
                    </span>
                    <p style={{ fontSize: 11, color: "#444" }}>completado</p>
                  </div>
                )}
              </div>
              {progDiaActivo && (
                <div className="progress-bar-track" style={{ marginTop: 14 }}>
                  <div className="progress-bar-fill" style={{ width: `${progDiaActivo.pct}%`, background: diaData?.color }} />
                </div>
              )}
              {(() => { const vol = volumenDia(diaActivo); return vol ? (
                <p style={{ fontSize: 11, color: "#555", marginTop: 6, fontFamily: "'Space Mono', monospace" }}>
                  ≈ {vol.toLocaleString("es")} kg movidos
                </p>
              ) : null; })()}
            </div>

            {/* Ejercicios */}
            {!diaData?.ejercicios.length ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#333" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>
                  {diaActivo === "JUEVES" ? "💤" : "🌿"}
                </div>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, letterSpacing: 1 }}>DÍA DE DESCANSO</p>
                <p style={{ fontSize: 12, marginTop: 8, color: "#2a2a3a" }}>Recarga energía para mañana 💪</p>
              </div>
            ) : (
              diaData.ejercicios.map((ej, i) => {
                const seriesHechas = Array.from({ length: ej.series }).filter((_, s) => serieHecha(ej.nombre, s)).length;
                const ejCompleto = seriesHechas === ej.series;
                const rm1 = calcular1RM(ej.nombre, ej.series, ej.reps);
                return (
                  <div key={i} className="ejercicio-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 500, color: ejCompleto ? diaData.color : "#e0e0f0", transition: "color 0.2s" }}>
                          {ejCompleto && "✓ "}{ej.nombre}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                          <p style={{ fontSize: 12, color: "#555" }}>
                            {ej.series} series × {ej.reps} reps
                          </p>
                          {rm1 !== null && (
                            <p style={{ fontSize: 11, color: diaData.color + "99", fontFamily: "'Space Mono', monospace" }}>
                              ≈{Math.round(rm1)}kg 1RM
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button
                          className="completar-btn"
                          onClick={() => completarTodoEjercicio(ej.nombre, ej.series, ejCompleto)}
                          style={{ color: ejCompleto ? diaData.color : "#555" }}
                        >
                          {ejCompleto ? "desmarcar" : "todo ✓"}
                        </button>
                        <span className="tag" style={{
                          background: ejCompleto ? diaData.color + "22" : "#1a1a2e",
                          color: ejCompleto ? diaData.color : "#444",
                        }}>
                          {seriesHechas}/{ej.series}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {Array.from({ length: ej.series }).map((_, s) => {
                        const hecha = serieHecha(ej.nombre, s);
                        const peso = getPeso(diaActivo, ej.nombre, s);
                        const pesoAnt = getPesoAnterior(diaActivo, ej.nombre, s);
                        return (
                          <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button
                              className={"serie-circle" + (hecha ? " hecha" : "")}
                              onClick={() => toggleSerie(ej.nombre, ej.series, s)}
                              style={{
                                color: hecha ? "#0a0a0f" : diaData.color,
                                background: hecha ? diaData.color : "transparent",
                                borderColor: diaData.color,
                              }}
                            >{s + 1}</button>
                            <input
                              className="peso-input"
                              type="text" inputMode="decimal" placeholder={pesoAnt ? `${pesoAnt}kg` : "kg"}
                              value={peso}
                              onChange={(e) => setPeso(diaActivo, ej.nombre, s, e.target.value)}
                              style={hecha ? { borderColor: diaData.color + "50" } : {}}
                            />
                            {peso && s === 0 && ej.series > 1 && (
                              <button
                                onClick={() => propagarPeso(diaActivo, ej.nombre, s, ej.series, peso)}
                                style={{
                                  background: "none", border: "none", cursor: "pointer",
                                  fontSize: 10, color: "#444", fontFamily: "'Space Mono', monospace",
                                  padding: "2px 4px", borderRadius: 4, whiteSpace: "nowrap",
                                }}
                                title="Aplicar este peso a todas las series"
                              >= todas</button>
                            )}
                            {!peso && pesoAnt && (
                              <span style={{ fontSize: 11, color: "#333", fontFamily: "'Space Mono', monospace" }}>
                                ↑{pesoAnt}
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

            {/* Notas del día */}
            {diaData?.ejercicios.length > 0 && (
              <div style={{ marginTop: 16, marginBottom: 8 }}>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 2, color: "#333", textTransform: "uppercase", marginBottom: 8 }}>
                  Notas del día
                </p>
                <textarea
                  className="nota-textarea"
                  placeholder="¿Cómo fue el entrenamiento? ¿Algo que notar?"
                  value={getNota(diaActivo)}
                  onChange={(e) => setNota(diaActivo, e.target.value)}
                />
              </div>
            )}

            {/* Resumen semanal */}
            <div style={{ marginTop: 24, background: "#14141c", borderRadius: 16, padding: 20, border: "1px solid #1e1e2e" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 2, color: "#444", textTransform: "uppercase" }}>
                  Resumen semanal
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {streak > 0 && (
                    <span style={{ fontSize: 12, color: "#666", fontFamily: "'Space Mono', monospace" }}>
                      🔥 {streak} {streak === 1 ? "semana" : "semanas"}
                    </span>
                  )}
                  <button
                    onClick={compartirResumen}
                    className="icon-btn"
                    title="Compartir resumen"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                {DIAS.map((dia) => {
                  const prog = progresoDia(dia);
                  const comp = diaCompletado(dia);
                  const color = rutina[dia]?.color || "#888";
                  return (
                    <div key={dia} style={{ textAlign: "center" }}>
                      <div style={{
                        width: "100%", aspectRatio: "1", borderRadius: 8,
                        background: comp ? color : prog === null ? "#1e1e2e" : `${color}22`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, marginBottom: 4,
                      }}>
                        {comp ? "✓" : prog === null ? "" : prog.hechas > 0 ? "·" : ""}
                      </div>
                      <span style={{ fontSize: 8, color: "#333", fontFamily: "'Space Mono', monospace" }}>
                        {dia.slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Limpiar semana */}
              <div style={{ marginTop: 16, textAlign: "center" }}>
                {confirmarLimpiar ? (
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#666" }}>¿Segura?</span>
                    <button
                      onClick={limpiarSemana}
                      style={{
                        background: "#2a1a1a", border: "1px solid #663333",
                        borderRadius: 8, color: "#f87171", cursor: "pointer",
                        padding: "5px 12px", fontSize: 12,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >sí, limpiar</button>
                    <button
                      onClick={() => setConfirmarLimpiar(false)}
                      style={{
                        background: "none", border: "1px solid #1e1e2e",
                        borderRadius: 8, color: "#555", cursor: "pointer",
                        padding: "5px 12px", fontSize: 12,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >cancelar</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmarLimpiar(true)}
                    style={{
                      background: "none", border: "none",
                      color: "#2a2a3a", cursor: "pointer",
                      fontSize: 11, letterSpacing: 1,
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >limpiar semana actual</button>
                )}
              </div>
            </div>

            <p style={{ textAlign: "center", fontSize: 11, color: "#222", marginTop: 24, letterSpacing: 1 }}>
              tu progreso se guarda automáticamente ✦
            </p>
          </div>
        </>
      )}

      {/* Timer de descanso */}
      {timer && (
        <div className="timer-panel" style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#0d0d14", borderTop: "1px solid #1e1e2e",
          padding: "14px 24px 18px", zIndex: 100,
        }}>
          {/* Barra de progreso */}
          <div style={{ height: 3, background: "#1e1e2e", borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${(timer.restantes / timer.duracion) * 100}%`,
              background: timer.restantes <= 10 ? "#f87171" : "#4ade80",
              transition: "width 1s linear, background 0.3s",
            }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <p style={{ fontSize: 10, color: "#555", letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>
                  descanso
                </p>
                <button
                  onClick={() => setTimerEnabled((v) => !v)}
                  title={timerEnabled ? "Desactivar timer automático" : "Activar timer automático"}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 12, opacity: timerEnabled ? 1 : 0.4, lineHeight: 1,
                  }}
                >
                  {timerEnabled ? "🔔" : "🔕"}
                </button>
              </div>
              <p className={timer.restantes <= 10 ? "timer-urgente" : ""} style={{
                fontFamily: "'Space Mono', monospace", fontSize: 40, fontWeight: 700,
                color: timer.restantes <= 10 ? "#f87171" : "#f0f0f5",
                lineHeight: 1, transition: "color 0.3s",
              }}>
                {String(Math.floor(timer.restantes / 60)).padStart(2, "0")}:{String(timer.restantes % 60).padStart(2, "0")}
              </p>
            </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[60, 90, 120].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setTimerDuracion(s);
                  setTimer({ restantes: s, duracion: s });
                }}
                style={{
                  background: timerDuracion === s ? "#1e1e2e" : "none",
                  border: "1px solid #2a2a3a", borderRadius: 8,
                  color: timerDuracion === s ? "#f0f0f5" : "#666",
                  padding: "5px 8px", fontSize: 11, cursor: "pointer",
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                {Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}
              </button>
            ))}
            <button
              onClick={() => setTimer(null)}
              style={{
                background: "none", border: "1px solid #2a2a3a",
                borderRadius: 8, color: "#555",
                padding: "5px 10px", fontSize: 13, cursor: "pointer",
              }}
            >✕</button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
