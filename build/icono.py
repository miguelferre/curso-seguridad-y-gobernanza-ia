"""Genera app/icono.ico: cuadrado violeta del Atlas con un escudo y "IA".

Uso: python build/icono.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
VIOLETA, CLARO = (91, 69, 184), (236, 232, 250)
N = 256
img = Image.new("RGBA", (N, N), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.rounded_rectangle([8, 8, N - 8, N - 8], radius=48, fill=VIOLETA)
# Escudo: rectángulo con punta inferior
d.polygon([(68, 52), (188, 52), (188, 140), (128, 210), (68, 140)], fill=CLARO)
fuente = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 78)
caja = d.textbbox((0, 0), "IA", font=fuente)
ancho, alto = caja[2] - caja[0], caja[3] - caja[1]
d.text((128 - ancho / 2 - caja[0], 112 - alto / 2 - caja[1]), "IA", font=fuente, fill=VIOLETA)
salida = RAIZ / "app" / "icono.ico"
img.save(salida, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
img.save(RAIZ / "_wip" / "icono-vista.png")
print(salida)
