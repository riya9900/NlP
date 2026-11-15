from reviewnlp.config import get_nlp_settings as get_settings


def resolve_device() -> str:
    pref = get_settings().device
    if pref != "auto":
        return pref
    try:
        import torch

        return "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        return "cpu"
