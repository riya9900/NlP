"""Generate a small multilingual demo dataset with a planted fake-review campaign.

Output: data/demo/headphones.json  (ground-truth fields `is_spam` and `aspects` are used by the
evaluation notebook only; the API ignores them).
Run:  uv run python scripts/make_demo_data.py
"""

import json
import random
from pathlib import Path

random.seed(7)

# aspect -> lang -> (positive phrases, negative phrases)
BANK = {
    "battery": {
        "en": (["The battery lasts all week.", "Battery life is fantastic, easily 30 hours."],
               ["Battery drains way too fast.", "Battery died after two days, disappointing."]),
        "de": (["Der Akku hält ewig.", "Die Akkulaufzeit ist hervorragend."],
               ["Der Akku ist viel zu schnell leer.", "Akku nach zwei Tagen am Ende, enttäuschend."]),
        "es": (["La batería dura toda la semana.", "La autonomía es excelente."],
               ["La batería se agota demasiado rápido.", "La batería dura muy poco."]),
        "fr": (["La batterie tient toute la semaine.", "L'autonomie est excellente."],
               ["La batterie se décharge beaucoup trop vite.", "Autonomie décevante."]),
        "ja": (["バッテリーが一週間持ちます。", "電池持ちが素晴らしいです。"],
               ["バッテリーの減りが早すぎます。", "電池がすぐなくなってがっかりです。"]),
    },
    "sound": {
        "en": (["Sound quality is superb with deep bass.", "Crystal clear sound, very balanced."],
               ["The sound is flat and tinny.", "Bass is muddy and the sound lacks detail."]),
        "de": (["Der Klang ist großartig mit tiefem Bass.", "Sehr klarer, ausgewogener Sound."],
               ["Der Klang ist flach und blechern.", "Der Bass ist matschig."]),
        "es": (["La calidad de sonido es excelente, con graves profundos.", "Sonido muy claro y equilibrado."],
               ["El sonido es plano y metálico.", "Los graves son confusos."]),
        "fr": (["La qualité sonore est superbe avec des basses profondes.", "Un son très clair et équilibré."],
               ["Le son est plat et métallique.", "Les basses sont brouillonnes."]),
        "ja": (["音質は素晴らしく、低音も深いです。", "とてもクリアでバランスの良い音です。"],
               ["音が平坦で安っぽいです。", "低音がこもっていて残念です。"]),
    },
    "comfort": {
        "en": (["Very comfortable, I wear them for hours.", "Lightweight and the ear pads are soft."],
               ["They hurt my ears after an hour.", "Too tight and uncomfortable for long use."]),
        "de": (["Sehr bequem, ich trage sie stundenlang.", "Leicht und die Ohrpolster sind weich."],
               ["Nach einer Stunde tun mir die Ohren weh.", "Zu eng und unbequem."]),
        "es": (["Muy cómodos, los uso durante horas.", "Ligeros y las almohadillas son suaves."],
               ["Me duelen los oídos después de una hora.", "Demasiado apretados e incómodos."]),
        "fr": (["Très confortables, je les porte des heures.", "Légers et les coussinets sont doux."],
               ["Ils me font mal aux oreilles après une heure.", "Trop serrés et inconfortables."]),
        "ja": (["とても快適で、何時間でも着けていられます。", "軽くてイヤーパッドも柔らかいです。"],
               ["一時間で耳が痛くなります。", "きつくて長時間は不快です。"]),
    },
    "mic": {
        "en": (["The microphone is clear on calls."], ["The microphone quality is terrible, people can't hear me.",
                                                        "Mic picks up too much noise on calls."]),
        "de": (["Das Mikrofon klingt bei Anrufen klar."], ["Die Mikrofonqualität ist schrecklich.",
                                                           "Das Mikrofon nimmt zu viele Geräusche auf."]),
        "es": (["El micrófono se oye claro en las llamadas."], ["La calidad del micrófono es terrible.",
                                                                "El micrófono capta demasiado ruido."]),
        "fr": (["Le micro est clair pendant les appels."], ["La qualité du micro est terrible.",
                                                             "Le micro capte trop de bruit."]),
        "ja": (["通話ではマイクの音がクリアです。"], ["マイクの品質がひどいです。", "マイクが雑音を拾いすぎます。"]),
    },
    "bluetooth": {
        "en": (["Bluetooth pairing is instant and stable."], ["Bluetooth keeps dropping every few minutes.",
                                                              "Connection disconnects randomly."]),
        "de": (["Die Bluetooth-Kopplung ist schnell und stabil."], ["Bluetooth bricht ständig ab.",
                                                                   "Die Verbindung trennt sich zufällig."]),
        "es": (["El emparejamiento Bluetooth es instantáneo y estable."], ["El Bluetooth se corta constantemente.",
                                                                          "La conexión se desconecta al azar."]),
        "fr": (["L'appairage Bluetooth est instantané et stable."], ["Le Bluetooth se coupe sans arrêt.",
                                                                      "La connexion se déconnecte au hasard."]),
        "ja": (["Bluetoothの接続は一瞬で安定しています。"], ["Bluetoothがしょっちゅう途切れます。", "接続が勝手に切れます。"]),
    },
}

LANGS = ["en"] * 5 + ["de"] * 3 + ["es"] * 2 + ["fr"] * 2 + ["ja"] * 2
# aspect -> probability the aspect is positive
POS_RATE = {"battery": 0.9, "sound": 0.85, "comfort": 0.8, "mic": 0.15, "bluetooth": 0.25}


def genuine(n: int) -> list[dict]:
    out = []
    for i in range(n):
        lang = random.choice(LANGS)
        aspects = random.sample(list(BANK), k=random.choice([1, 2, 2, 3]))
        parts, pos = [], 0
        for a in aspects:
            is_pos = random.random() < POS_RATE[a]
            pos += is_pos
            parts.append(random.choice(BANK[a][lang][0 if is_pos else 1]))
        rating = max(1, min(5, round(1 + 4 * pos / len(aspects) + random.choice([-0.4, 0, 0.4]))))
        out.append(
            {"id": f"g{i}", "text": " ".join(parts), "rating": rating, "language": lang,
             "author": f"user{random.randint(1000, 9999)}", "is_spam": False, "aspects": aspects}
        )
    return out


SPAM_TEMPLATES = [
    "BEST PRODUCT EVER!!! Highly recommend, buy now!!!",
    "Best product ever!!! Must buy, highly recommended!!! Five stars!!!",
    "Amazing amazing product, highly recommend. Buy now!!!",
    "Best purchase ever!!! Highly recommend to everyone, buy now!!!",
]


def spam(n: int) -> list[dict]:
    return [
        {"id": f"s{i}", "text": random.choice(SPAM_TEMPLATES), "rating": 5, "language": "en",
         "author": "promo_account" if i % 3 == 0 else f"user{random.randint(1000, 9999)}",
         "is_spam": True, "aspects": []}
        for i in range(n)
    ]


if __name__ == "__main__":
    data = genuine(80) + spam(14)
    random.shuffle(data)
    out = Path(__file__).resolve().parent.parent / "data" / "demo" / "headphones.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"product": "Aurora X1 Wireless Headphones", "reviews": data},
                              ensure_ascii=False, indent=1), encoding="utf8")
    print(f"wrote {len(data)} reviews -> {out}")
