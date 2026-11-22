#!/usr/bin/env python3
"""Ikoner, og-bild och favicon för Mathsnake – få detaljer, tydliga former."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

HÄR = Path(__file__).parent
PUB = HÄR / "public"
FONT = PUB / "fonts"

PAPPER = (250, 247, 242)
INK = (20, 24, 31)
DISKRET = (74, 82, 96)
GRÖN = (47, 125, 79)
GRÖN_DJUP = (31, 90, 56)
ÄPPLE = (212, 69, 63)
SKAFT = (125, 59, 42)


def font(storlek, vikt=600):
    return ImageFont.truetype(str(FONT / f"fredoka-{vikt}.ttf"), storlek)


def runda(d, box, radie, fyll):
    d.rounded_rectangle(box, radius=radie, fill=fyll)


def orm_huvud(d, cx, cy, r, riktning=1):
    """Ett enkelt ormhuvud: cirkel, två ögon."""
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=GRÖN_DJUP)
    öga = r * 0.26
    for tecken in (-1, 1):
        ex = cx + riktning * r * 0.30
        ey = cy + tecken * r * 0.34
        d.ellipse([ex - öga, ey - öga, ex + öga, ey + öga], fill=PAPPER)
        d.ellipse([ex - öga * 0.5 + riktning * öga * 0.3, ey - öga * 0.5,
                   ex + öga * 0.5 + riktning * öga * 0.3, ey + öga * 0.5], fill=INK)


def äpple(d, cx, cy, r, skaft=True):
    d.ellipse([cx - r * 1.06, cy - r * 0.9, cx - r * 0.02, cy + r * 0.95], fill=ÄPPLE)
    d.ellipse([cx - r * 0.02, cy - r * 0.9, cx + r * 1.06, cy + r * 0.95], fill=ÄPPLE)
    if skaft:
        d.line([(cx, cy - r * 0.75), (cx + r * 0.22, cy - r * 1.15)], fill=SKAFT, width=max(2, int(r * 0.16)))


def ikon(storlek=512):
    """Grön platta med ett rött äpple och ett vitt plus – läsbart ner till 48 px."""
    S = storlek * 4
    bild = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(bild)
    runda(d, [0, 0, S - 1, S - 1], int(S * 0.225), GRÖN)

    # äpple: en enda rund form med skaft, inga extra detaljer
    cx, cy, r = S * 0.50, S * 0.545, S * 0.285
    d.ellipse([cx - r, cy - r * 0.96, cx + r, cy + r * 0.96], fill=ÄPPLE)
    d.line([(cx, cy - r * 0.90), (cx + r * 0.10, cy - r * 1.34)], fill=SKAFT,
           width=int(S * 0.055))

    # plus: två tjocka streck, rundade ändar
    b, l = int(S * 0.075), int(S * 0.31)
    d.rounded_rectangle([cx - l / 2, cy - b / 2, cx + l / 2, cy + b / 2],
                        radius=int(b * 0.5), fill=(255, 255, 255))
    d.rounded_rectangle([cx - b / 2, cy - l / 2, cx + b / 2, cy + l / 2],
                        radius=int(b * 0.5), fill=(255, 255, 255))

    return bild.resize((storlek, storlek), Image.LANCZOS)


def og():
    B, H = 1200, 630
    bild = Image.new("RGB", (B, H), PAPPER)
    d = ImageDraw.Draw(bild)

    d.text((72, 64), "MATH SNAKE", font=font(26), fill=(*DISKRET, 255))

    # frågan – allt barnet behöver veta
    d.text((72, 128), "7 + 4", font=font(150), fill=INK)

    # tre äpplen med svar
    svar = ["9", "11", "13"]
    x = 84
    for i, s in enumerate(svar):
        cy = 400
        äpple(d, x + 60, cy, 56)
        f = font(62)
        bb = d.textbbox((0, 0), s, font=f)
        d.text((x + 60 - (bb[2] - bb[0]) / 2 - bb[0], cy - (bb[3] - bb[1]) / 2 - bb[1] - 4), s, font=f, fill=(255, 255, 255))
        x += 168

    # orm till höger
    d.line([(760, 470), (940, 470)], fill=GRÖN, width=54)
    d.ellipse([700, 443, 808, 551], fill=GRÖN)
    orm_huvud(d, 968, 470, 46, riktning=1)

    d.text((72, 528), "Ät rätt svar. Väx. En minut.", font=font(38, 500), fill=DISKRET)
    bild.save(PUB / "og.png", optimize=True)


def huvud():
    PUB.mkdir(exist_ok=True)
    ikon(512).save(PUB / "icon-512.png")
    ikon(192).save(PUB / "icon-192.png")
    ikon(180).save(PUB / "apple-touch-icon.png")
    ikon(48).save(PUB / "favicon.png")
    og()


if __name__ == "__main__":
    huvud()
    print("klart:", sorted(p.name for p in PUB.glob("*.png")))