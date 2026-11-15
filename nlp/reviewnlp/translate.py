"""English -> other language translation with MarianMT (Helsinki-NLP opus-mt), CPU friendly (~300 MB per language,
downloaded on first use). Used to show the summary and theme labels in the language the shopper picked."""

from functools import lru_cache

from reviewnlp.device import resolve_device
from reviewnlp.preprocess import split_sentences

# target code -> (model, optional target-language prefix token for multi-target models)
MODELS: dict[str, tuple[str, str]] = {
    "de": ("Helsinki-NLP/opus-mt-en-de", ""),
    "es": ("Helsinki-NLP/opus-mt-en-es", ""),
    "fr": ("Helsinki-NLP/opus-mt-en-fr", ""),
    "it": ("Helsinki-NLP/opus-mt-en-it", ""),
    "hi": ("Helsinki-NLP/opus-mt-en-hi", ""),
    "zh": ("Helsinki-NLP/opus-mt-en-zh", ">>cmn_Hans<<"),
    "ja": ("Helsinki-NLP/opus-mt-en-jap", ""),
    "ar": ("Helsinki-NLP/opus-mt-en-ar", ">>ara<<"),
    "ru": ("Helsinki-NLP/opus-mt-en-ru", ""),
    "pt": ("Helsinki-NLP/opus-mt-en-ROMANCE", ">>pt<<"),
}


def supported(lang: str) -> bool:
    return lang in MODELS


@lru_cache(maxsize=4)
def _load(model_name: str):
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

    tok = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(resolve_device())
    model.eval()
    return tok, model


def _translate_batch(sentences: list[str], target: str) -> list[str]:
    import torch

    name, prefix = MODELS[target]
    tok, model = _load(name)
    src = [f"{prefix} {s}".strip() for s in sentences]
    out: list[str] = []
    for i in range(0, len(src), 16):
        batch = tok(src[i : i + 16], return_tensors="pt", padding=True, truncation=True, max_length=256)
        batch = {k: v.to(model.device) for k, v in batch.items()}
        with torch.inference_mode():
            gen = model.generate(**batch, num_beams=2, max_new_tokens=256)
        out += tok.batch_decode(gen, skip_special_tokens=True)
    return out


def translate(texts: list[str], target: str) -> list[str]:
    """Translate each text (English) into `target`. Long texts are translated sentence by sentence."""
    if target == "en" or not supported(target):
        return texts
    pieces: list[str] = []
    owner: list[int] = []
    for idx, t in enumerate(texts):
        sents = split_sentences(t, min_chars=1) or [t]
        pieces += sents
        owner += [idx] * len(sents)
    done = _translate_batch(pieces, target) if pieces else []
    joined: list[list[str]] = [[] for _ in texts]
    for o, tr in zip(owner, done):
        joined[o].append(tr)
    sep = "" if target in ("ja", "zh") else " "
    return [sep.join(j) for j in joined]
