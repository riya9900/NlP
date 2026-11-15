"""Aspect labelling + summary blurb via an OpenAI-compatible LLM (vLLM serving Qwen2.5-7B-Instruct-AWQ).

The LLM never invents facts: it only names clusters that were already built from real
review sentences, and writes a blurb from their statistics.
"""

import json
import logging
import re

import httpx

from app.config import get_settings

log = logging.getLogger("llm")

LANG_NAMES = {
    "en": "English", "de": "German", "es": "Spanish", "fr": "French", "ja": "Japanese",
    "zh": "Chinese", "pt": "Portuguese", "it": "Italian", "hi": "Hindi", "ar": "Arabic",
    "ko": "Korean", "ru": "Russian", "nl": "Dutch", "tr": "Turkish",
}

SYSTEM = (
    "You analyse e-commerce product reviews. You are given clusters of review sentences "
    "(possibly in different languages) with statistics. Name each cluster with a short "
    "aspect label (1-3 words) and write a faithful 2-3 sentence summary. Use only the "
    "provided evidence. Reply with JSON only."
)


def _prompt(clusters: list[dict], lang: str) -> str:
    target = LANG_NAMES.get(lang, "English")
    blocks = []
    for c in clusters:
        quotes = "\n".join(f"  - {q}" for q in c["quotes"])
        blocks.append(
            f"Cluster {c['id']} (mentions={c['mentions']}, sentiment={c['sentiment']:+.2f}):\n{quotes}"
        )
    return (
        f"Write all output in {target}.\n\n" + "\n\n".join(blocks) +
        '\n\nReturn JSON: {"labels": {"<cluster id>": "<label>", ...}, "blurb": "<2-3 sentence summary '
        'of what shoppers like and dislike, ordered by importance>"}'
    )


def _parse(text: str) -> dict:
    m = re.search(r"\{.*\}", text, re.S)
    return json.loads(m.group(0) if m else text)


async def label_and_summarize(clusters: list[dict], lang: str) -> dict | None:
    """Returns {"labels": {id: str}, "blurb": str} or None if the LLM is unavailable."""
    s = get_settings()
    if not s.llm_enabled or not clusters:
        return None
    payload = {
        "model": s.llm_model,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": _prompt(clusters, lang)},
        ],
        "temperature": 0.2,
        "max_tokens": 700,
        "response_format": {"type": "json_object"},
    }
    headers = {"X-Worker-Token": s.worker_token} if s.worker_token else {}
    try:
        async with httpx.AsyncClient(timeout=s.llm_timeout) as client:
            r = await client.post(f"{s.llm_url}/chat/completions", json=payload, headers=headers)
        r.raise_for_status()
        data = _parse(r.json()["choices"][0]["message"]["content"])
        labels = {int(k): str(v).strip() for k, v in data.get("labels", {}).items()}
        return {"labels": labels, "blurb": str(data.get("blurb", "")).strip()}
    except Exception as e:  # LLM is optional: never fail the request because of it
        log.warning("LLM unavailable, using extractive fallback: %s", type(e).__name__)
        return None
