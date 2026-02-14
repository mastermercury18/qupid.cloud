import React, { useMemo, useState } from "react";
import { Activity, Atom, Heart, Zap } from "lucide-react";

const QupidApp = () => {
  const [entanglement, setEntanglement] = useState(72);
  const [communication, setCommunication] = useState(64);
  const [stressors, setStressors] = useState(true);
  const [noise, setNoise] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const result = useMemo(() => {
    const base = entanglement * 0.6 + communication * 0.4;
    const penalty = (stressors ? 10 : 0) + (noise ? 12 : 0);
    const purity = Math.max(42, Math.min(99, Math.round(base - penalty + 18)));
    const coherent = purity >= 70;
    const advice = coherent
      ? "State stabilized. Lean into shared rituals and playful exploration. Small, frequent check-ins keep the wavefunction aligned."
      : "Decoherence detected. Reduce external noise, create a calm boundary, and prioritize clarity over volume to restore signal integrity.";
    return { purity, coherent, advice };
  }, [entanglement, communication, stressors, noise]);

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0a0f2a] via-[#1a1140] to-[#2b0f3a] text-white"
      style={{ fontFamily: '"Nunito", "Avenir Next", sans-serif' }}
    >
      <div className="pointer-events-none absolute -top-28 left-1/3 h-72 w-72 rounded-full bg-[#00ffff] opacity-20 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-[#ffb6c1] opacity-20 blur-[160px]" />
      <div className="pointer-events-none absolute right-8 top-24 h-40 w-40 rounded-full bg-white/10 blur-[80px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl rounded-[32px] border border-white/20 bg-white/10 p-6 shadow-[0_0_45px_rgba(0,255,255,0.12)] backdrop-blur-2xl md:p-10">
          <header className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Atom className="h-6 w-6 text-cyan-200" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-wide text-white drop-shadow-[0_0_14px_rgba(0,255,255,0.4)] md:text-4xl">
                  qupid
                </h1>
                <p className="text-sm uppercase tracking-[0.22em] text-white/70">
                  Macroscopic Superposition Analysis
                </p>
              </div>
            </div>
            <p className="text-white/70">
              Harmonize two wavefunctions with soft cyberpunk insights. Tune the Hamiltonian to
              evolve a relationship state.
            </p>
          </header>

          <section className="mt-8 rounded-[28px] border border-white/15 bg-white/5 p-6">
            <div className="mb-6 flex items-center gap-2 text-lg font-semibold">
              <Activity className="h-5 w-5 text-cyan-200" />
              <span>The Hamiltonian</span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center justify-between text-sm text-white/70">
                  <span>Entanglement Strength</span>
                  <span className="font-mono text-white">{entanglement}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={entanglement}
                  onChange={(event) => setEntanglement(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-cyan-200"
                />
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between text-sm text-white/70">
                  <span>Communication Frequency</span>
                  <span className="font-mono text-white">{communication}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={communication}
                  onChange={(event) => setCommunication(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-pink-200"
                />
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Toggle
                label="External Stressors (Work/Family)"
                enabled={stressors}
                onChange={setStressors}
              />
              <Toggle
                label="Communication Noise (Dephasing)"
                enabled={noise}
                onChange={setNoise}
              />
            </div>
          </section>

          <div className="mt-8 flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex items-center gap-3 text-sm text-white/70">
              <Heart className="h-5 w-5 text-pink-200" />
              <span>Quantum pairing is best when synchronized daily.</span>
            </div>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-[#00ffff] via-white/80 to-[#ffb6c1] px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#101027] shadow-[0_0_24px_rgba(0,255,255,0.35)] transition hover:shadow-[0_0_36px_rgba(255,182,193,0.55)]"
            >
              <Zap className="h-5 w-5" />
              Evolve Quantum State
              <span className="absolute inset-0 -z-10 rounded-full bg-white/20 blur-xl transition duration-500 group-hover:opacity-70" />
            </button>
          </div>

          {revealed && (
            <section className="mt-10 rounded-[28px] border border-white/20 bg-white/10 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      result.coherent
                        ? "bg-cyan-200/20 text-cyan-100 shadow-[0_0_18px_rgba(0,255,255,0.45)]"
                        : "bg-pink-200/20 text-pink-100 shadow-[0_0_18px_rgba(255,182,193,0.45)]"
                    }`}
                  >
                    State: {result.coherent ? "Coherent" : "Decohered"}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">Purity Score</p>
                  <p
                    className="text-4xl font-semibold text-white"
                    style={{ fontFamily: '"Space Mono", "JetBrains Mono", monospace' }}
                  >
                    {result.purity}% Purity
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/15 bg-white/5 p-5 text-sm text-white/80 shadow-inner">
                <p style={{ fontFamily: '"Space Mono", "JetBrains Mono", monospace' }}>
                  {result.advice}
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

const Toggle = ({ label, enabled, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!enabled)}
    className="flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition hover:border-white/30"
  >
    <span>{label}</span>
    <span
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
        enabled ? "bg-cyan-200/70" : "bg-white/20"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </span>
  </button>
);

export default QupidApp;
