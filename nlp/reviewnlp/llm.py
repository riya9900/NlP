"""Theme labels + summary blurb from a small local instruct model (default Qwen2.5-0.5B-Instruct, CPU-friendly).

The model never sees the raw review dump: it only names clusters already built from real review
sentences, and writes the blurb from their statistics. Every step has a deterministic fallback
(c-TF-IDF keywords / template sentence), so the output is never empty even if generation fails.
"""

import logging
import re
from functools import lru_cache

from reviewnlp.config import get_nlp_settings
from reviewnlp.device import resolve_device

log = logging.getLogger("reviewnlp.llm")

LANG_NAMES = {
    "en": "English", "de": "German", "es": "Spanish", "fr": "French", "ja": "Japanese",
    "zh": "Chinese", "pt": "Portuguese", "it": "Italian", "hi": "Hindi", "ar": "Arabic",
    "ko": "Korean", "ru": "Russian", "nl": "Dutch", "tr": "Turkish",
}


@lru_cache
def _load():
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    name = get_nlp_settings().llm_model
    dev = resolve_device()
    tok = AutoTokenizer.from_pretrained(name)
    model = AutoModelForCausalLM.from_pretrained(
        name, dtype=torch.bfloat16 if dev == "cuda" else torch.float32
    ).to(dev)
    model.eval()
    return tok, model, dev


def _chat(prompt: str, max_new_tokens: int) -> str:
    import torch

    tok, model, dev = _load()
    text = tok.apply_chat_template(
        [
            {"role": "system", "content": "You are a concise e-commerce review analyst."},
            {"role": "user", "content": prompt},
        ],
        tokenize=False,
        add_generation_prompt=True,
    )
    inputs = tok(text, return_tensors="pt").to(dev)
    with torch.inference_mode():
        out = model.generate(
            **inputs, max_new_tokens=max_new_tokens, do_sample=False, pad_token_id=tok.eos_token_id
        )
    return tok.decode(out[0][inputs["input_ids"].shape[1] :], skip_special_tokens=True).strip()


def label_cluster(quotes: list[str], lang: str) -> str | None:
    target = LANG_NAMES.get(lang, "English")
    sample = "\n".join(f"- {q[:160]}" for q in quotes[:4])
    out = _chat(
        f"These sentences from product reviews are about the same aspect:\n{sample}\n\n"
        f"Name the aspect in 1-3 words in {target} (e.g. 'Battery life', 'Sound quality'). "
        "Reply with the label only.",
        max_new_tokens=10,
    )
    label = re.sub(r"[\"'`*.:\n].*$", "", out.split("\n")[0]).strip(" -")
    return label[:40] if 2 <= len(label) <= 40 else None


def write_blurb(pros: list[tuple[str, int]], cons: list[tuple[str, int]], lang: str) -> str | None:
    target = LANG_NAMES.get(lang, "English")
    liked = ", ".join(f"{l} ({n} mentions)" for l, n in pros) or "none"
    disliked = ", ".join(f"{l} ({n} mentions)" for l, n in cons) or "none"
    out = _chat(
        f"Shoppers liked: {liked}.\nShoppers disliked: {disliked}.\n\n"
        f"Write a 2-sentence summary for a shopper in {target}. Use only these facts, no new claims.",
        max_new_tokens=90,
    )
    out = out.strip().strip('"')
    return out if len(out) > 20 else None


def template_blurb(pros: list[str], cons: list[str]) -> str:
    """Deterministic fallback (English)."""
    parts = []
    if pros:
        parts.append("Shoppers mainly praise " + ", ".join(pros[:3]).lower() + ".")
    if cons:
        parts.append("The most common complaints are " + ", ".join(cons[:3]).lower() + ".")
    return " ".join(parts) or "Not enough consistent feedback to summarise yet."
