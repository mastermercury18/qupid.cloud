import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";
import {
  Activity,
  Atom,
  Heart,
  Sparkles,
  Upload,
  User,
  UserRound,
  Waves,
  Shield,
  Zap,
} from "lucide-react";
import quantumGradient from "./assets/pink-holographic.avif";
import densityMatrix from "./assets/density_matrix.png";
import qutipVisual from "./assets/qutip_visual.png";
import textPanel from "./assets/text.png";
import sine from "./assets/sine_2.gif";
import markov from "./assets/bloch_dephase.png";
import logo from "./assets/qupid_logo.png";

const parameterSections = [
  {
    title: "mutual dynamic - the floquet driver",
    icon: Activity,
    items: [
      ["mutualEmpathy", "mutual empathy"],
      ["mutualCompatability", "compatibility"],
      ["mutualFrequency", "frequency of interactions"],
      ["mutualStrength", "strength of interactions"],
      ["mutualSync", "how in sync you both are"],
      ["mutualCodependence", "how negatively codependent you are"],
    ],
  },
  {
    title: "person a",
    icon: User,
    items: [
      ["personATemperarment", "temperament"],
      ["personAHotCold", "how hot/cold they are"],
      ["personADistant", "how distant they are"],
      ["personABurnedOut", "how burned out they are"],
    ],
  },
  {
    title: "person b",
    icon: UserRound,
    items: [
      ["personBTemperarment", "temperament"],
      ["personBHotCold", "how hot/cold they are"],
      ["personBDistant", "how distant they are"],
      ["personBBurnedOut", "how burned out they are"],
    ],
  },
];

const neoGlassPanel =
  "liquid-panel rounded-[40px] border border-white/40 bg-white/18 backdrop-blur-[36px] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),inset_0_-4px_12px_rgba(0,0,0,0.3),0_60px_140px_rgba(6,10,30,0.55)]";

const neoGlassInner =
  "liquid-inner rounded-2xl border border-white/30 bg-[linear-gradient(150deg,rgba(255,255,255,0.22),rgba(255,255,255,0.08))] backdrop-blur-[22px] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_12px_22px_rgba(6,10,30,0.3)]";

const QupidApp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLabRoute = location.pathname.startsWith("/lab");
  const isResultsRoute = location.pathname === "/lab/results";
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [serverResult, setServerResult] = useState(null);
  const [serverError, setServerError] = useState("");
  const landingRef = useRef(null);
  const appRef = useRef(null);
  const showLab = isLabRoute;
  const revealed = isResultsRoute;

  const inferredValues = serverResult?.inferred_params || null;
  const displayScore = serverResult?.health_score;
  const displayCoherent = displayScore !== undefined ? displayScore >= 70 : false;
  const displayAdvice =
    serverResult?.report_text || "upload a text conversation and run analysis to predict the trajectory.";

  const reportBlocks = useMemo(() => {
    if (!displayAdvice) return [];
    const lines = displayAdvice
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const headings = new Set([
      "OUTLOOK",
      "NEAR TERM (NEXT 2-4 WEEKS)",
      "MID TERM (1-3 MONTHS)",
      "LONG TERM (3-12 MONTHS)",
      "RISKS",
      "INTERVENTIONS",
    ]);

    const blocks = [];
    let current = { heading: null, text: [] };

    for (const line of lines) {
      const upper = line.toUpperCase();
      if (headings.has(upper)) {
        if (current.heading || current.text.length) {
          blocks.push({ ...current, text: current.text.join(" ") });
        }
        current = { heading: line, text: [] };
      } else {
        current.text.push(line);
      }
    }

    if (current.heading || current.text.length) {
      blocks.push({ ...current, text: current.text.join(" ") });
    }

    if (!blocks.length) {
      return [{ heading: "OUTLOOK", text: displayAdvice }];
    }

    return blocks;
  }, [displayAdvice]);

  useEffect(() => {
    const target = appRef.current || landingRef.current;
    if (!target) return;
    renderMathInElement(target, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
    });
  }, [showLab, serverResult]);

  const topSummary = useMemo(() => {
    if (!inferredValues) return [];
    return [
      ["messages analyzed", serverResult?.messages_analyzed ?? "-"],
      ["person a", inferredValues.personAName || "person A"],
      ["person b", inferredValues.personBName || "person B"],
    ];
  }, [inferredValues, serverResult]);

  const handleAnalyzeAndEvolve = async () => {
    setServerError("");
    if (!selectedFiles.length) {
      setServerError("please upload up to 10 screenshots of your conversation.");
      return;
    }
    navigate("/lab/results");

    setIsRunning(true);
    try {
      const formData = new FormData();
      selectedFiles.slice(0, 10).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/analyze-run", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "backend error");
      }
      setServerResult(data);
    } catch (error) {
      setServerError(error.message || "unable to reach the quantum backend.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      ref={appRef}
      className="relative min-h-screen overflow-hidden bg-[#070914] text-white"
      style={{ fontFamily: '"Nunito", "Avenir Next", sans-serif' }}
    >
      <style>{`
        @keyframes liquid-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes liquid-shift {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        @keyframes liquid-glow {
          0% { box-shadow: 0 10px 30px rgba(0,255,255,0.25); }
          50% { box-shadow: 0 14px 42px rgba(255,182,193,0.45); }
          100% { box-shadow: 0 10px 30px rgba(0,255,255,0.25); }
        }
        .liquid-float {
          animation: liquid-float 8s ease-in-out infinite;
        }
        .liquid-shift {
          background-size: 200% 200%;
          animation: none;
        }
        .liquid-panel {
          position: relative;
          overflow: hidden;
        }
        .liquid-panel::after {
          content: "";
          position: absolute;
          inset: -40% -20%;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent 55%);
          opacity: 0.6;
          transform: translateX(-10%);
          animation: none;
          pointer-events: none;
        }
        .liquid-inner {
          position: relative;
          overflow: hidden;
        }
        .liquid-inner::after {
          content: "";
          position: absolute;
          inset: -30% -10%;
          background: radial-gradient(circle at 70% 20%, rgba(255,255,255,0.12), transparent 60%);
          opacity: 0.5;
          animation: none;
          pointer-events: none;
        }
        .liquid-cta {
          animation: liquid-glow 6s ease-in-out infinite;
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker {
          display: flex;
          width: max-content;
          gap: 2.5rem;
          animation: ticker-scroll 28s linear infinite;
          white-space: nowrap;
        }
        .ticker-track {
          overflow: hidden;
        }
        @keyframes card-pop {
          0% { opacity: 0; transform: translateY(14px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0px) scale(1); }
        }
        .card-reveal {
          opacity: 0;
          animation: card-pop 0.7s ease-out forwards;
        }
        .card-delay-1 { animation-delay: 0.05s; }
        .card-delay-2 { animation-delay: 0.1s; }
        .card-delay-3 { animation-delay: 0.15s; }
        .card-delay-4 { animation-delay: 0.2s; }
        .card-delay-5 { animation-delay: 0.25s; }
        .card-delay-6 { animation-delay: 0.3s; }
      `}</style>
      <div
        className="liquid-shift pointer-events-none absolute inset-0 bg-cover bg-center opacity-35"
        style={{
          backgroundImage: `url(${quantumGradient})`,
          filter: "contrast(1.12) saturate(1.18) brightness(0.95)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-50 mix-blend-screen">
        <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,255,0.12),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(255,182,193,0.14),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.08),transparent_45%)]" />
      </div>

      <div className={`relative z-10 min-h-screen px-4 py-12 ${neoGlassPanel}`}>
        {!showLab && (
          <div className="mx-auto w-full max-w-6xl">
            <div className="relative">
              <section ref={landingRef} className="space-y-6">
                <section className="min-h-screen flex items-center justify-center">
                  <div className={`${neoGlassPanel} card-reveal card-delay-1 w-full max-w-6xl min-h-[75vh] px-6 py-10 flex items-center sm:px-10 sm:py-12 md:min-h-[85vh] md:px-16 md:py-20`}>
                    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                      <div className="text-left">
                        <p className="text-xs uppercase tracking-[0.4em] text-white/65">predict your situationship with quantum physics</p>
                        <h1 className="mt-6 text-4xl font-semibold tracking-[0.08em] leading-[0.95] text-white sm:text-5xl md:text-6xl">
                          qupid.cloud
                        </h1>
                        <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-white/80 md:mt-8 md:text-lg">

                          qupid runs your relationship through a time-dependent quantum engine. upload screenshots of your most
                          recent text convos, and we evolve the state forward to predict where it goes next.
                          <br />
                          <br />
                          are you ready to dive into the future of relationships?
                        </p>
                        <div className="mt-10 flex flex-col items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              navigate("/lab");
                              setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
                            }}
                            className="liquid-cta inline-flex items-center justify-center rounded-full bg-[linear-gradient(120deg,rgba(0,255,255,0.9),rgba(255,255,255,0.92),rgba(255,182,193,0.95))] px-8 py-3 text-xs font-semibold tracking-[0.32em] text-[#101027]"
                          >
                            enter the lab
                          </button>
                          <a
                            href="https://form.jotform.com/260442360762150"
                            className="liquid-cta inline-flex items-center justify-center rounded-full bg-[linear-gradient(120deg,rgba(0,255,255,0.9),rgba(255,255,255,0.92),rgba(255,182,193,0.95))] px-8 py-3 text-xs font-semibold tracking-[0.32em] text-[#101027]"
                            target="_blank"
                            rel="noreferrer"
                          >
                            beta tester feedback form
                          </a>
                        </div>
                      </div>
                      <div className={`${neoGlassPanel} relative min-h-[240px] overflow-hidden rounded-[28px] sm:min-h-[320px]`}>
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-90"
                          style={{ backgroundImage: `url(${logo})` }}
                        />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(0,255,255,0.25),transparent_55%),radial-gradient(circle_at_75%_80%,rgba(255,182,193,0.35),transparent_60%)]" />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="flex pt-6 justify-center">
                  <div className="space-y-6">
                    <div className={`${neoGlassPanel} card-reveal card-delay-2 w-full max-w-4xl p-6`}>
                      <div className="flex w-full flex-col items-center justify-center text-center">
                        <img
                          src={textPanel}
                          alt="text message example"
                          className="h-auto w-full max-w-[700px] rounded-[24px]"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="flex justify-center pt-6">
                  <div className={`${neoGlassPanel} w-full max-w-5xl p-10`}>
                    <p className="text-center text-sm md:text-base uppercase tracking-[0.28em] italic text-white/80">
                      we don't just analyze compatibility. we predict it.
                    </p>
                  </div>
                </section>

                <section className="min-h-[70vh] flex flex-col justify-center">
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3 mb-10">
                      <div className={`${neoGlassPanel} card-reveal card-delay-2 min-h-[500px] p-7 text-sm text-white/80`}>
                        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-white/65">two-qubit love</p>
                        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                          <p className="text-lg md:text-xl italic leading-relaxed text-white/90">
                            we model your bond as a two-qubit density matrix
                          </p>
                          <img
                            src={densityMatrix}
                            alt="two-qubit density matrix"
                            className="h-auto w-full max-w-[220px]"
                          />
                        </div>
                      </div>
                      <div className={`${neoGlassPanel} card-reveal card-delay-3 min-h-[500px] p-7 text-sm text-white/80`}>
                        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-white/65">floquet drive</p>
                        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                          <p className="text-lg md:text-xl italic leading-relaxed text-white/90">
                            we periodically drive your relationship with a floquet hamiltonian
                          </p>
                          <img
                            src={sine}
                            alt="sine floquet"
                            className="h-auto w-full max-w-[220px]"
                          />
                        </div>
                      </div>
                      <div className={`${neoGlassPanel} card-reveal card-delay-4 min-h-[500px] p-7 text-sm text-white/80`}>
                        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-white/65">markov noise</p>
                        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                          <p className="text-lg md:text-xl italic leading-relaxed text-white/90">
                            we capture burnout and drift with markov-lindblad operators
                          </p>
                          <img
                            src={markov}
                            alt="markov noise"
                            className="h-auto w-full max-w-[220px]"
                          />
                        </div>
                      </div>
                    </div>
                    <div className={`${neoGlassPanel} card-reveal card-delay-4 mx-auto w-full max-w-5xl p-6 sm:p-8 md:min-h-[700px] md:p-10`}>
                      <p className="text-xs uppercase tracking-[0.28em] text-white/65">technical core</p>
                      <div className="mt-4 space-y-4 text-xs leading-6 text-white/80 sm:text-sm sm:leading-7">
                        <p>
                          we model your relationship as a two-qubit quantum system with density matrix
                          {" $\\rho(t)$"} evolving under the floquet-markov-lindblad master equation:
                        </p>
                        <p>{"$$\\frac{d\\rho}{dt}=-i[H(t),\\rho]+\\sum_k\\left(L_k\\rho L_k^\\dagger-\\frac{1}{2}\\{L_k^\\dagger L_k,\\rho\\}\\right).$$"}</p>
                        <p>
                          the term {"$-i[H(t),\\rho]$"} represents inherent dynamics like attraction,
                          attachment, and reciprocity encoded in the hamiltonian {"$H(t)$"}:
                        </p>
                        <p>{"$$H(t)=\\frac{\\omega_A}{2}\\sigma_z\\otimes I+\\frac{\\omega_B}{2}I\\otimes\\sigma_z+J\\,\\sigma_x\\otimes\\sigma_x+A\\cos(\\Omega t)\\,\\sigma_z\\otimes\\sigma_z.$$"}</p>
                        <ul className="list-disc pl-5">
                          <li>{"$\\omega_A,\\,\\omega_B$"} model individual emotional baselines.</li>
                          <li>{"$J$"} is the coupling strength (compatibility / emotional interaction).</li>
                          <li>{"$A\\cos(\\Omega t)$"} introduces periodic forcing (push–pull cycles).</li>
                        </ul>
                        <p>because real relationships are not isolated systems, we include lindblad operators:</p>
                        <p>{"$$L_{\\phi,A}=\\sqrt{\\gamma_{\\phi,A}}\\,\\sigma_z\\otimes I,\\quad L_{\\phi,B}=\\sqrt{\\gamma_{\\phi,B}}\\,I\\otimes\\sigma_z,$$"}</p>
                        <p>representing dephasing (miscommunication, emotional drift), and</p>
                        <p>{"$$L_{x,A}=\\sqrt{\\gamma_{x,A}}\\,\\sigma_x\\otimes I,\\quad L_{x,B}=\\sqrt{\\gamma_{x,B}}\\,I\\otimes\\sigma_x,$$"}</p>
                        <p>representing bit-flip events (mixed signals, behavioral inconsistency).</p>
                        <p>
                          long-term behavior depends on evolution across full drive cycles. stability,
                          resonance, or decay emerge naturally from integrating the master equation.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="min-h-[55vh] flex flex-col justify-start pt-6">
                  <div className="space-y-6">
                    <div className={`${neoGlassPanel} card-reveal card-delay-5 mx-auto w-full max-w-4xl min-h-[375px] p-10`}>
                      <p className="text-xs uppercase tracking-[0.28em] text-white/65">visualize + predict</p>
                      <div className="mt-4 flex h-full flex-col items-center justify-center gap-4 text-center">
                        <p className="text-sm leading-7 text-white/85">
                          entirely simulated by qutip, a quantum toolbox in python
                        </p>
                        <img
                          src={qutipVisual}
                          alt="qutip visualization"
                          className="w-full max-w-[560px] rounded-[24px]"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="flex pt-6">
                  <div className="space-y-6"></div>
                  <div className={`${neoGlassPanel} w-full p-4`}>
                    <div className="ticker-track">
                      <div className="ticker text-xs uppercase tracking-[0.28em] text-white/75">
                        <span>coupled • driven • noisy • nonlinear • sensitive • evolving • resonant • unstable • coherent • decohering • stabilizing • integrating • predicting • becoming...</span>
                        <span>coupled • driven • noisy • nonlinear • sensitive • evolving • resonant • unstable • coherent • decohering • stabilizing • integrating • predicting • becoming...</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="flex justify-center pt-6">
                  <p className="max-w-5xl text-center text-xs leading-relaxed text-white/70">
                    i created this app for fun. it is inspired by complex mathematical and physical models,
                    but it may not be entirely accurate for the real world. after all, love is unpredictable.
                    use this to reflect and gain insights into your own emotions and relationships, not make life-altering decisions.
                  </p>
                </section>

              </section>
            </div>
          </div>
        )}

        {showLab && (
          <div className="flex min-h-screen items-center justify-center">
            <div className={`liquid-float w-full max-w-5xl ${neoGlassPanel} p-6 md:p-10`}>
              <div className="relative">
            <header className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
                  <Atom className="h-6 w-6 text-cyan-200" />
                </div>
                <span className="text-xs uppercase tracking-[0.4em] text-white/55">quantum relationship lab</span>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-[0.08em] text-white drop-shadow-[0_0_18px_rgba(0,255,255,0.45)] md:text-6xl">
                    qupid.cloud
                  </h1>
                  <p className="text-base text-white/75 md:text-lg">
                    predict how your situationship will evolve using open quantum dynamics.
                  </p>
                </div>

                <div />
              </div>
            </header>

            <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            <section id="analysis" className={`${neoGlassPanel} card-reveal card-delay-1 p-4 md:p-5`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-[0.18em] text-white/80">
                    upload text message conversation
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    accepted formats: png, jpg, jpeg (up to 10 screenshots)
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/35 bg-white/18 px-4 py-2 text-xs tracking-[0.14em] text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition hover:border-white/50">
                  <Upload className="h-4 w-4 text-cyan-200" />
                  choose screenshots
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    multiple
                    className="hidden"
                    onChange={(event) => setSelectedFiles(Array.from(event.target.files || []).slice(0, 10))}
                  />
                </label>
              </div>
              <div className="mt-3 text-sm text-white/70">
                {selectedFiles.length
                  ? `selected: ${selectedFiles.length} screenshot${selectedFiles.length > 1 ? "s" : ""}`
                  : "no screenshots selected"}
              </div>
            </section>

            {inferredValues && (
              <>
                <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                <section className="grid gap-5 lg:grid-cols-3">
                  {parameterSections.map((section) => (
                    <div key={section.title} className={`${neoGlassPanel} card-reveal card-delay-2 p-4`}>
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-white/80">
                        <section.icon className="h-4 w-4 text-cyan-200" />
                        <h3>{section.title}</h3>
                      </div>
                      <div className="grid gap-2">
                        {section.items.map(([key, label]) => (
                          <ParamRow key={key} label={label} value={inferredValues[key]} />
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              </>
            )}

            <div className="mt-8 flex flex-col items-center gap-4 md:flex-row md:justify-between">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <Heart className="h-5 w-5 text-pink-200" />
                <span>qupid creates a unique lindbladian for your situationship </span>
              </div>
              <button
                type="button"
                onClick={handleAnalyzeAndEvolve}
                disabled={isRunning}
                className="liquid-cta group relative flex items-center gap-3 rounded-full bg-[linear-gradient(120deg,rgba(0,255,255,0.9),rgba(255,255,255,0.92),rgba(255,182,193,0.95))] px-8 py-3 text-sm font-semibold tracking-[0.18em] text-[#101027] shadow-[0_10px_30px_rgba(0,255,255,0.35)] transition hover:shadow-[0_14px_40px_rgba(255,182,193,0.55)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Zap className={`h-5 w-5 ${isRunning ? "animate-pulse" : ""}`} />
                {isRunning ? "analyzing + evolving..." : "analyze & evolve quantum state"}
                <span className="absolute inset-0 -z-10 rounded-full bg-white/35 blur-2xl transition duration-500 group-hover:opacity-70" />
              </button>
            </div>

            <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            <div />

            {revealed && (
              <section className="mt-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-4 py-1 text-xs font-semibold tracking-[0.2em] ${
                        displayCoherent
                          ? "bg-cyan-200/20 text-cyan-100 shadow-[0_0_18px_rgba(0,255,255,0.45)]"
                          : "bg-pink-200/20 text-pink-100 shadow-[0_0_18px_rgba(255,182,193,0.45)]"
                      }`}
                    >
                      state: {displayCoherent ? "coherent" : "decohered"}
                    </span>
                  </div>
                </div>

                {topSummary.length > 0 && (
                  <div className="mt-4 grid gap-2 md:grid-cols-3">
                    {topSummary.map(([label, value]) => (
                      <ParamRow key={label} label={label} value={value} compact />
                    ))}
                  </div>
                )}

                {/* {serverResult?.analyzer_debug && (
                  <div className={`mt-6 ${neoGlassPanel} p-5 text-sm text-white/80`}>
                    <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/60">
                      analyzer debug
                    </p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {Object.entries(serverResult.analyzer_debug).map(([key, value]) => (
                        <ParamRow key={key} label={key.replace(/_/g, " ")} value={value} compact />
                      ))}
                    </div>
                  </div>
                )} */}

                {serverResult?.plot_base64 && (
                  <div className="mt-6 space-y-3">
                    <img
                      alt="relationship dynamics plot"
                      src={`data:image/png;base64,${serverResult.plot_base64}`}
                      className="card-reveal card-delay-3 h-auto w-full rounded-2xl"
                    />
                    <p className="text-xs uppercase tracking-[0.28em] text-white/60">
                      how to read this
                    </p>
                    <p className="text-sm text-white/75">
                      {serverResult?.plot_caption ||
                        "Each line tracks your emotional state over time. When the lines rise together, the connection feels aligned; when they split or dip, the situationship cools or drifts."}
                    </p>
                  </div>
                )}

                {serverError ? (
                  <p className="mt-6 text-sm text-white/80" style={{ fontFamily: '"Space Mono", "JetBrains Mono", monospace' }}>
                    {serverError}
                  </p>
                ) : (
                  <div className="mt-6 space-y-4 text-white/80">
                    <p className="text-xs uppercase tracking-[0.35em] text-white/65">trajectory report</p>
                    <div className="grid gap-5">
                      {reportBlocks.map((block, index) => (
                        <div
                          key={`${block.heading || "report"}-${index}`}
                          className={`${neoGlassPanel} card-reveal card-delay-4 px-5 py-4`}
                        >
                          {block.heading && (
                            <p className="mb-3 text-[11px] uppercase tracking-[0.32em] text-white/65">
                              {block.heading}
                            </p>
                          )}
                          <p className="text-sm leading-7 text-white/85">{block.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Badge = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 rounded-full border border-white/35 bg-white/16 px-3 py-1 text-[11px] tracking-[0.25em] text-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_18px_rgba(6,10,30,0.3)]">
    <Icon className="h-3.5 w-3.5 text-cyan-200" />
    <span>{label}</span>
  </div>
);

const ParamRow = ({ label, value, compact = false }) => {
  const displayValue =
    value === null || value === undefined
      ? "-"
      : typeof value === "object"
        ? JSON.stringify(value)
        : value;
  return (
    <div className={`flex items-center justify-between ${neoGlassInner} px-3 py-2 ${compact ? "text-xs" : "text-sm"}`}>
      <span className="text-white/70">{label}</span>
      <span className="font-mono text-white">{displayValue}</span>
    </div>
  );
};

export default QupidApp;
