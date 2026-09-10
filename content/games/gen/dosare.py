# Compune „dosarele" jocului Detectivul climatic din imagini care există deja
# în content/games (toate CC0/PD, cu proveniența în SOURCES.md).
# Fiecare dosar = 4 indicii, fără nicio etichetă care să trădeze răspunsul.
import os
from PIL import Image, ImageDraw, ImageFont

G = r'C:\Users\Liliana\catedra\content\games'
OUT = os.path.join(G, 'medii-dosare')

DOSARE = [
    ('dosar-1-ecuatorial',   ('medii-dosare', 'climograma-ecuatorial.png'),        ('bio-vegetatie-areale', 'areal-ecuatorial.png'),   ('soluri-profile', 'sol-1-laterit.jpg'),     ('bio-biom-plante', 'plant-liane.jpg')),
    ('dosar-2-savana',       ('medii-dosare', 'climograma-subecuatorial.png'),     ('bio-vegetatie-areale', 'areal-savana.png'),       ('soluri-profile', 'sol-2-feralitic.jpg'),   ('bio-vegetatie-animale', 'an-girafa.jpg')),
    ('dosar-3-desert',       ('medii-dosare', 'climograma-tropical-uscat.png'),    ('bio-vegetatie-areale', 'areal-desert.png'),       ('soluri-profile', 'sol-3-nisipos.jpg'),     ('bio-biom-plante', 'plant-curmal.jpg')),
    ('dosar-4-mediteranean', ('medii-dosare', 'climograma-mediteranean.png'),      ('bio-vegetatie-areale', 'areal-mediteranean.png'), ('soluri-profile', 'sol-4-terra-rosa.jpg'),  ('bio-vegetatie-animale', 'an-broasca-testoasa.jpg')),
    ('dosar-5-foioase',      ('medii-dosare', 'climograma-temperat-oceanic.png'),  ('bio-vegetatie-areale', 'areal-foioase.png'),      ('soluri-profile', 'sol-6-argiluvisol.jpg'), ('bio-biom-plante', 'plant-fag.jpg')),
    ('dosar-6-stepa',        ('medii-dosare', 'climograma-stepa.png'),            ('bio-vegetatie-areale', 'areal-stepa.png'),        ('soluri-profile', 'sol-5-molisol.jpg'),     ('bio-vegetatie-animale', 'an-bizon.jpg')),
    ('dosar-7-taiga',        ('medii-dosare', 'climograma-taiga.png'),            ('bio-vegetatie-areale', 'areal-taiga.png'),        ('soluri-profile', 'sol-7-podzol.jpg'),      ('bio-vegetatie-animale', 'an-elan.jpg')),
    ('dosar-8-tundra',       ('medii-dosare', 'climograma-subpolar.png'),          ('bio-vegetatie-areale', 'areal-tundra.png'),       ('soluri-profile', 'sol-8-turbos.jpg'),      ('bio-biom-plante', 'plant-licheni.jpg')),
]

LABELS = ['1 · Regimul climatic', '2 · Arealul pe glob', '3 · Profilul de sol', '4 · Specie caracteristică']

CW, CH = 620, 440          # caseta unui indiciu
PAD, LAB, GAP = 14, 34, 12
W = PAD * 2 + CW * 2 + GAP
H = PAD * 2 + (CH + LAB) * 2 + GAP

CREAM, INK, BORDER, MUTED = (253, 246, 236), (34, 51, 59), (216, 210, 196), (92, 107, 115)

def font(sz):
    for p in (r'C:\Windows\Fonts\segoeui.ttf', r'C:\Windows\Fonts\arial.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

F = font(21)

def fit(im, bw, bh, bg):
    """Încadrează imaginea în casetă, păstrând raportul, pe fundal crem."""
    im = im.convert('RGB')
    r = min(bw / im.size[0], bh / im.size[1])
    im = im.resize((max(1, int(im.size[0] * r)), max(1, int(im.size[1] * r))), Image.LANCZOS)
    cell = Image.new('RGB', (bw, bh), bg)
    cell.paste(im, ((bw - im.size[0]) // 2, (bh - im.size[1]) // 2))
    return cell

for name, *parts in DOSARE:
    sheet = Image.new('RGB', (W, H), CREAM)
    d = ImageDraw.Draw(sheet)
    for i, (folder, fn) in enumerate(parts):
        src = os.path.join(G, folder, fn)
        assert os.path.exists(src), src
        col, row = i % 2, i // 2
        x = PAD + col * (CW + GAP)
        y = PAD + row * (CH + LAB + GAP)
        d.text((x + 2, y + 6), LABELS[i], fill=MUTED, font=F)
        cell = fit(Image.open(src), CW, CH, CREAM)
        sheet.paste(cell, (x, y + LAB))
        d.rectangle([x, y + LAB, x + CW - 1, y + LAB + CH - 1], outline=BORDER, width=2)
    path = os.path.join(OUT, name + '.webp')
    sheet.save(path, 'WEBP', quality=86, method=6)
    print(f'{name:24} {sheet.size}  {os.path.getsize(path)//1024} KB')
