import base64
import os

import google.generativeai as genai


def _load_gemini_api_key() -> str:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
    api_key = api_key.strip()
    if (api_key.startswith('"') and api_key.endswith('"')) or (api_key.startswith("'") and api_key.endswith("'")):
        api_key = api_key[1:-1].strip()
    if not api_key:
        raise ValueError("Missing GEMINI_API_KEY (or GOOGLE_API_KEY).")
    return api_key


def _build_model():
    api_key = _load_gemini_api_key()
    genai.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_REPORT_MODEL", "gemini-2.5-flash-lite").strip() or "gemini-2.5-flash-lite"
    return genai.GenerativeModel(model_name)


def _extract_text(response):
    return getattr(response, "text", "") or ""


def _strip_asterisks(text):
    return text.replace("**", "").replace("*", "")


def generate_gemini_report(plot_b64, trajectory_metrics, inferred_params, conversation_insights):
    model = _build_model()

    system_prompt = (
        "You are writing a long, detailed relationship trajectory report. "
        "Use simple English language/vocabularly in a conversational, astrologer tone but mix real scientific quantum terminology"
        "Do NOT include a separate 'quantum analysis' section. "
        "Instead, weave a few quantum terms (coherence, drift, coupling, noise, phase) into human language. "
        "The report must be a forward-looking prediction of how the relationship will evolve over time, "
        "driven by the simulated trajectory. "
        "Ground the report in personal details from the conversation insights so the users feel seen and heard. "
        "Use those details as concrete anchors in each section, not just as a generic summary. "
        "Refer to Person A as 'you' throughout. "
        "Refer to Person B only by their contact name (provided in personBName). Do not say 'Person B'. "
        "Be precise, concrete, and avoid filler."
    )

    metrics = trajectory_metrics or {}
    insights = conversation_insights or []
    params = inferred_params or {}

    user_prompt = f"""
Write a detailed report based on:
- Trajectory metrics: {metrics}
- Inferred parameters (0-100): {params}
- Conversation insights (bullets): {insights}

Structure with these headings, in order (all-caps, single line):
OUTLOOK
NEAR TERM (next 2-4 weeks)
MID TERM (1-3 months)
LONG TERM (3-12 months)
RISKS
INTERVENTIONS

Each section should be 2-4 sentences. Keep it predictive, time-based, and grounded in the simulated trajectory.
Use a few quantum terms inside the human analysis. Do not summarize the conversation. Instead, weave in
specific details from the conversation insights as evidence in each section. Make it consistent with the plot.
""".strip()

    contents = [
        f"{system_prompt}\n\n{user_prompt}",
    ]

    if plot_b64:
        try:
            image_bytes = base64.b64decode(plot_b64)
            contents.append({"mime_type": "image/png", "data": image_bytes})
        except Exception:
            pass

    response = model.generate_content(
        contents,
        generation_config={
            "max_output_tokens": 1200,
        },
    )

    raw_text = _extract_text(response)
    return _strip_asterisks(raw_text)


def generate_gemini_caption(plot_b64, trajectory_metrics, inferred_params):
    model = _build_model()
    metrics = trajectory_metrics or {}
    params = inferred_params or {}

    prompt = f"""
Write a 1-2 sentence caption that explains what this relationship trajectory graph means.
Make it feel personal and predictive, grounded in the trajectory metrics.
Keep it short and clear.

Trajectory metrics: {metrics}
Inferred parameters (0-100): {params}
""".strip()

    contents = [prompt]
    if plot_b64:
        try:
            image_bytes = base64.b64decode(plot_b64)
            contents.append({"mime_type": "image/png", "data": image_bytes})
        except Exception:
            pass

    response = model.generate_content(
        contents,
        generation_config={
            "max_output_tokens": 120,
        },
    )

    raw_text = _extract_text(response)
    return _strip_asterisks(raw_text).strip()
