import csv
import io
import json
import math
import os
import re
from collections import defaultdict
from datetime import datetime

import google.generativeai as genai

POSITIVE_WORDS = {
    "love", "great", "good", "amazing", "happy", "glad", "excited", "thanks", "thank",
    "appreciate", "proud", "care", "caring", "sweet", "kind", "fun", "wonderful", "yes",
}
NEGATIVE_WORDS = {
    "angry", "mad", "upset", "sad", "hurt", "annoyed", "frustrated", "bad", "hate",
    "tired", "drained", "stressed", "anxious", "worried", "no", "never", "can't", "cant",
}
EMPATHY_WORDS = {
    "sorry", "understand", "hear you", "i hear", "you okay", "you ok", "here for you",
    "that makes sense", "proud of you", "i'm here", "im here",
}


def clamp_0_100(value):
    return max(0, min(100, int(round(value))))


def _expand_midrange(value, strength=0.45):
    """
    Expands values away from 50 to reduce mid-range clustering.
    strength in [0,1]; higher -> stronger expansion.
    """
    x = max(0.0, min(1.0, value / 100.0))
    k = 4.0 + 6.0 * strength  # Logistic curve centered at 0.5
    logistic = 1.0 / (1.0 + math.exp(-k * (x - 0.5)))
    blended = (1.0 - strength) * x + strength * logistic
    return clamp_0_100(blended * 100.0)


def _strength_from_total(total):
    # Increase spread as dataset grows.
    return max(0.35, min(0.75, 0.35 + math.log10(total + 1) / 3.0))


def _scale_linear(value, min_v, max_v):
    if max_v <= min_v:
        return 50.0
    return max(0.0, min(100.0, (value - min_v) / (max_v - min_v) * 100.0))


def _scale_log(value, max_v):
    value = max(0.0, value)
    max_v = max(1.0, max_v)
    return max(0.0, min(100.0, (math.log1p(value) / math.log1p(max_v)) * 100.0))


def _scale_centered(value, mid, spread):
    if spread <= 0:
        return 50.0
    return max(0.0, min(100.0, 50.0 + ((value - mid) / spread) * 50.0))


def _parse_timestamp(raw):
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        try:
            return datetime.fromtimestamp(float(raw))
        except Exception:
            return None
    text = str(raw).strip()
    if not text:
        return None
    for fmt in (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%m/%d/%Y %H:%M:%S",
        "%m/%d/%Y %H:%M",
        "%m/%d/%Y",
    ):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            pass
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00"))
    except Exception:
        return None


def _tokenize(text):
    return re.findall(r"[a-zA-Z']+", (text or "").lower())


def _sentiment_score(text):
    tokens = _tokenize(text)
    if not tokens:
        return 0.0
    pos = sum(1 for t in tokens if t in POSITIVE_WORDS)
    neg = sum(1 for t in tokens if t in NEGATIVE_WORDS)
    return (pos - neg) / max(1, len(tokens))


def _empathy_score(text):
    lower = (text or "").lower()
    hits = sum(1 for phrase in EMPATHY_WORDS if phrase in lower)
    return hits


def parse_messages_from_upload(file_storage):
    filename = (file_storage.filename or "").lower()
    raw = file_storage.read()
    text = raw.decode("utf-8", errors="ignore")

    messages = []

    if filename.endswith(".json"):
        data = json.loads(text)
        records = data.get("messages", data) if isinstance(data, dict) else data
        if isinstance(records, list):
            for row in records:
                if not isinstance(row, dict):
                    continue
                messages.append(
                    {
                        "sender": row.get("sender") or row.get("from") or row.get("author") or "Unknown",
                        "text": row.get("text") or row.get("message") or row.get("body") or "",
                        "timestamp": _parse_timestamp(row.get("timestamp") or row.get("time") or row.get("date")),
                    }
                )

    elif filename.endswith(".csv"):
        reader = csv.DictReader(io.StringIO(text))
        for row in reader:
            messages.append(
                {
                    "sender": row.get("sender") or row.get("from") or row.get("author") or "Unknown",
                    "text": row.get("text") or row.get("message") or row.get("body") or "",
                    "timestamp": _parse_timestamp(row.get("timestamp") or row.get("time") or row.get("date")),
                }
            )

    else:
        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue
            parts = line.split(":", 1)
            if len(parts) == 2 and len(parts[0]) < 40:
                sender = parts[0].strip() or "Unknown"
                body = parts[1].strip()
            else:
                sender = "Unknown"
                body = line
            messages.append({"sender": sender, "text": body, "timestamp": None})

    messages = [m for m in messages if (m.get("text") or "").strip()]
    messages.sort(key=lambda m: m["timestamp"] or datetime.min)
    return messages


def _std(values):
    if not values:
        return 0.0
    mean = sum(values) / len(values)
    return math.sqrt(sum((v - mean) ** 2 for v in values) / len(values))


def _most_common_senders(messages):
    sender_counts = defaultdict(int)
    for m in messages:
        sender_counts[m["sender"]] += 1
    if not sender_counts:
        return "Person A", "Person B"
    sorted_senders = sorted(sender_counts.items(), key=lambda x: x[1], reverse=True)
    sender_a = sorted_senders[0][0]
    sender_b = sorted_senders[1][0] if len(sorted_senders) > 1 else "Person B"
    return sender_a, sender_b


def _format_messages_for_prompt(messages, max_chars=18000):
    lines = []
    total_chars = 0
    for m in messages:
        timestamp = m.get("timestamp")
        ts = timestamp.isoformat() if timestamp else ""
        sender = m.get("sender") or "Unknown"
        text = (m.get("text") or "").replace("\n", " ").strip()
        line = f"{ts} | {sender}: {text}" if ts else f"{sender}: {text}"
        if total_chars + len(line) + 1 > max_chars:
            break
        lines.append(line)
        total_chars += len(line) + 1
    return "\n".join(lines)


def _parse_model_json(raw_text):
    raw_text = (raw_text or "").strip()
    if not raw_text:
        raise ValueError("Gemini returned empty output.")
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        start = raw_text.find("{")
        end = raw_text.rfind("}")
        if start >= 0 and end > start:
            return json.loads(raw_text[start : end + 1])
        raise


def _coerce_param(value):
    try:
        return clamp_0_100(float(value))
    except Exception:
        return 50


def _coerce_insights(value):
    if isinstance(value, list):
        cleaned = [str(v).strip() for v in value if str(v).strip()]
        return cleaned[:6]
    if isinstance(value, str) and value.strip():
        # Split on newlines or bullets if the model returned a single block.
        parts = [p.strip("•*- \t") for p in re.split(r"[\n\r]+", value) if p.strip()]
        return parts[:6]
    return []


def _load_gemini_api_key() -> str:
    """
    Loads the Gemini/Google API key from the environment, strips whitespace/quotes,
    and validates it looks non-empty.
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
    api_key = api_key.strip()

    # If someone accidentally saved quotes into the env var (common on Windows),
    # remove one pair of surrounding quotes.
    if (api_key.startswith('"') and api_key.endswith('"')) or (api_key.startswith("'") and api_key.endswith("'")):
        api_key = api_key[1:-1].strip()

    if not api_key:
        raise ValueError(
            "Missing GEMINI_API_KEY (or GOOGLE_API_KEY). Set it in your environment (and restart your terminal/IDE) before running."
        )

    return api_key


def infer_parameters(messages):
    if not messages:
        raise ValueError("No valid messages found in the uploaded file.")

    sender_a, sender_b = _most_common_senders(messages)
    formatted_messages = _format_messages_for_prompt(messages)
    if not formatted_messages:
        raise ValueError("No message content available for analysis.")

    api_key = _load_gemini_api_key()
    model_name = os.getenv("GEMINI_ANALYZER_MODEL", "gemini-2.5-flash-lite").strip() or "gemini-2.5-flash-lite"
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)

    system_prompt = (
        "You are a precision extractor for a quantum relationship simulator. "
        "Given a conversation, output ONLY JSON with 0-100 integer values."
    )

    user_prompt = f"""
Return a JSON object with exactly these keys:
mutualEmpathy, mutualCompatability, mutualFrequency, mutualStrength, mutualSync, mutualCodependence,
personATemperarment, personAHotCold, personADistant, personABurnedOut,
personBTemperarment, personBHotCold, personBDistant, personBBurnedOut,
personAName, personBName, conversationInsights.

Scoring guidance (0-100):
- mutualEmpathy: warmth, validation, care between them.
- mutualCompatability: alignment, shared tone, ease of flow.
- mutualFrequency: how often they interact.
- mutualStrength: overall signal intensity / engagement.
- mutualSync: turn-taking rhythm and responsiveness.
- mutualCodependence: unhealthy over-attachment, volatility, dependency.
- person*Temperarment: steady emotional tone.
- person*HotCold: volatility and sudden swings.
- person*Distant: emotional distance / delayed responses.
- person*BurnedOut: fatigue, withdrawal, low energy.

Use {sender_a!r} as personAName and {sender_b!r} as personBName unless the text clearly implies better labels.
Return ONLY valid JSON. No commentary.
conversationInsights should be 3-6 short bullet-style strings, grounded in the text.

Conversation:
{formatted_messages}
""".strip()

    response = model.generate_content(
        f"{system_prompt}\n\n{user_prompt}",
        generation_config={
            "response_mime_type": "application/json",
            "max_output_tokens": 800,
        },
    )

    raw_text = getattr(response, "text", "") or ""

    data = _parse_model_json(raw_text)

    required_keys = [
        "mutualEmpathy",
        "mutualCompatability",
        "mutualFrequency",
        "mutualStrength",
        "mutualSync",
        "mutualCodependence",
        "personATemperarment",
        "personAHotCold",
        "personADistant",
        "personABurnedOut",
        "personBTemperarment",
        "personBHotCold",
        "personBDistant",
        "personBBurnedOut",
        "personAName",
        "personBName",
        "conversationInsights",
    ]

    missing = [k for k in required_keys if k not in data]
    if missing:
        raise ValueError(f"Gemini response missing keys: {', '.join(missing)}")

    inferred = {
        "mutualEmpathy": _coerce_param(data["mutualEmpathy"]),
        "mutualCompatability": _coerce_param(data["mutualCompatability"]),
        "mutualFrequency": _coerce_param(data["mutualFrequency"]),
        "mutualStrength": _coerce_param(data["mutualStrength"]),
        "mutualSync": _coerce_param(data["mutualSync"]),
        "mutualCodependence": _coerce_param(data["mutualCodependence"]),
        "personATemperarment": _coerce_param(data["personATemperarment"]),
        "personAHotCold": _coerce_param(data["personAHotCold"]),
        "personADistant": _coerce_param(data["personADistant"]),
        "personABurnedOut": _coerce_param(data["personABurnedOut"]),
        "personBTemperarment": _coerce_param(data["personBTemperarment"]),
        "personBHotCold": _coerce_param(data["personBHotCold"]),
        "personBDistant": _coerce_param(data["personBDistant"]),
        "personBBurnedOut": _coerce_param(data["personBBurnedOut"]),
        "personAName": "You",
        "personBName": str(data["personBName"])[:64],
    }

    conversation_insights = _coerce_insights(data.get("conversationInsights", []))

    debug = {
        "model": model_name,
        "messages_sent": len(messages),
        "prompt_chars": len(formatted_messages),
        "personAName": inferred["personAName"],
        "personBName": inferred["personBName"],
        "conversationInsights": conversation_insights,
    }

    return inferred, debug


def infer_parameters_from_images(files):
    if not files:
        raise ValueError("No screenshots provided.")
    if len(files) > 10:
        raise ValueError("Please upload 10 or fewer screenshots.")

    api_key = _load_gemini_api_key()
    model_name = os.getenv("GEMINI_ANALYZER_MODEL", "gemini-2.5-flash-lite").strip() or "gemini-2.5-flash-lite"
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)

    system_prompt = (
        "You are a precision extractor for a quantum relationship simulator. "
        "You will receive screenshots of a text conversation in order. "
        "Person A is the user (blue/purple/green message bubbles on the right). "
        "Person B is the recipient (gray message bubbles on the left). "
        "Extract 0-100 integer values for each parameter."
    )

    user_prompt = """
Return a JSON object with exactly these keys:
mutualEmpathy, mutualCompatability, mutualFrequency, mutualStrength, mutualSync, mutualCodependence,
personATemperarment, personAHotCold, personADistant, personABurnedOut,
personBTemperarment, personBHotCold, personBDistant, personBBurnedOut,
personAName, personBName, conversationInsights.

Scoring guidance (0-100):
- mutualEmpathy: warmth, validation, care between them.
- mutualCompatability: alignment, shared tone, ease of flow.
- mutualFrequency: how often they interact.
- mutualStrength: overall signal intensity / engagement.
- mutualSync: turn-taking rhythm and responsiveness.
- mutualCodependence: unhealthy over-attachment, volatility, dependency.
- person*Temperarment: steady emotional tone.
- person*HotCold: volatility and sudden swings.
- person*Distant: emotional distance / delayed responses.
- person*BurnedOut: fatigue, withdrawal, low energy.

Rules:
- Person A is always the user (colored bubbles on the right).
- Person B is always the recipient (gray bubbles on the left).
- If a contact name is visible, use it as personBName. Otherwise use "Person B".
- Always set personAName to "You".
- conversationInsights should be 3-6 short bullet-style strings grounded in what you can read.
Return ONLY valid JSON. No commentary.
""".strip()

    contents = [f"{system_prompt}\n\n{user_prompt}"]
    for file_storage in files:
        file_storage.stream.seek(0)
        data = file_storage.read()
        mime_type = file_storage.mimetype or "image/png"
        contents.append({"mime_type": mime_type, "data": data})

    response = model.generate_content(
        contents,
        generation_config={
            "response_mime_type": "application/json",
            "max_output_tokens": 900,
        },
    )

    raw_text = getattr(response, "text", "") or ""
    data = _parse_model_json(raw_text)

    required_keys = [
        "mutualEmpathy",
        "mutualCompatability",
        "mutualFrequency",
        "mutualStrength",
        "mutualSync",
        "mutualCodependence",
        "personATemperarment",
        "personAHotCold",
        "personADistant",
        "personABurnedOut",
        "personBTemperarment",
        "personBHotCold",
        "personBDistant",
        "personBBurnedOut",
        "personAName",
        "personBName",
        "conversationInsights",
    ]

    missing = [k for k in required_keys if k not in data]
    if missing:
        raise ValueError(f"Gemini response missing keys: {', '.join(missing)}")

    inferred = {
        "mutualEmpathy": _coerce_param(data["mutualEmpathy"]),
        "mutualCompatability": _coerce_param(data["mutualCompatability"]),
        "mutualFrequency": _coerce_param(data["mutualFrequency"]),
        "mutualStrength": _coerce_param(data["mutualStrength"]),
        "mutualSync": _coerce_param(data["mutualSync"]),
        "mutualCodependence": _coerce_param(data["mutualCodependence"]),
        "personATemperarment": _coerce_param(data["personATemperarment"]),
        "personAHotCold": _coerce_param(data["personAHotCold"]),
        "personADistant": _coerce_param(data["personADistant"]),
        "personABurnedOut": _coerce_param(data["personABurnedOut"]),
        "personBTemperarment": _coerce_param(data["personBTemperarment"]),
        "personBHotCold": _coerce_param(data["personBHotCold"]),
        "personBDistant": _coerce_param(data["personBDistant"]),
        "personBBurnedOut": _coerce_param(data["personBBurnedOut"]),
        "personAName": str(data["personAName"])[:64],
        "personBName": str(data["personBName"])[:64],
    }

    conversation_insights = _coerce_insights(data.get("conversationInsights", []))

    debug = {
        "model": model_name,
        "screenshots_sent": len(files),
        "personAName": inferred["personAName"],
        "personBName": inferred["personBName"],
        "conversationInsights": conversation_insights,
    }

    return inferred, debug
