#!/usr/bin/env python3
"""Serie de videos explicativos de la app Enganche (9:16) con capturas reales y voz en off.

Uso: python3 build_explainers.py [numero_de_video ...]   (sin argumentos: los 5)
La llave se lee de ELEVENLABS_API_KEY y nunca se imprime.
"""
import hashlib
import json
import os
import subprocess
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
API = "https://api.elevenlabs.io/v1"
KEY = os.environ.get("ELEVENLABS_API_KEY")
VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # voz femenina premade, modelo multilingüe
FPS = 30
PAD = 0.4
WORKERS = 4

INTRO_SUB = "Te mostramos paso a paso, con la app real."
OUTRO_VOZ = "Enganche. Todo el gremio del aluminio y vidrio, enganchado. Entra gratis con tu celular."


def intro(titulo_html, voz):
    return {"type": "intro", "voz": voz, "title_html": titulo_html}


def pantalla(img, voz, caption, **extra):
    return {"type": "screen", "img": f"shots/{img}.png", "voz": voz, "caption": caption, **extra}


OUTRO = {"type": "outro", "voz": OUTRO_VOZ}

VIDEOS = {
    1: {
        "slug": "01_crea_tu_cuenta", "title": "Crea tu cuenta",
        "steps": [
            intro('Crea tu <span class="o">cuenta</span>', "Cómo crear tu cuenta en Enganche."),
            pantalla("01_entrar_celular", "Entra solo con tu número de celular. No necesitas contraseña.",
                     "Solo tu <b>celular</b>, sin contraseñas", tap={"x": 50, "y": 35.6}, tapAt=2.0),
            pantalla("02_entrar_codigo", "Te llega un código de seis dígitos por WhatsApp. Escríbelo y toca Verificar.",
                     "Código de <b>6 dígitos</b> por WhatsApp", tap={"x": 50, "y": 41.5}, tapAt=2.4),
            pantalla("03b_registro_completo", "Completa tu perfil: cómo trabajas, tu ciudad, qué ofreces y tu experiencia. Acepta los términos y listo.",
                     "Completa tu <b>perfil</b> en un minuto", scroll=True),
            pantalla("04_inicio", "Desde el inicio ves ofertas, publicas, y sigues tus publicaciones y postulaciones.",
                     "Todo desde el <b>inicio</b>", focus={"x": 50, "y": 45, "s": 1.12}),
            OUTRO,
        ],
    },
    2: {
        "slug": "02_publica_una_oferta", "title": "Publica una oferta",
        "steps": [
            intro('Publica una <span class="o">oferta</span>', "Cómo publicar una oferta en Enganche."),
            pantalla("05_inicio_empresa", "En el inicio, toca Publicar una oferta.",
                     "Toca <b>Publicar una oferta</b>", tap={"x": 50, "y": 52}, tapAt=1.2),
            pantalla("06_publicar_vacio", "Elige si necesitas producción o instalación, y el nivel del sistema.",
                     "Tipo de trabajo y <b>nivel</b>", focus={"x": 50, "y": 30, "s": 1.18}),
            pantalla("07b_publicar_lleno_completo", "Describe el trabajo, la cantidad, los metros cuadrados y el valor que pagas. Tú defines el precio, sin regateo.",
                     "Tú defines el <b>valor</b>", scroll=True),
            pantalla("08_feed", "Tu oferta aparece a los talleres e instaladores que están cerca de la obra.",
                     "La ven quienes están <b>cerca</b>", focus={"x": 50, "y": 55, "s": 1.12}),
            OUTRO,
        ],
    },
    3: {
        "slug": "03_encuentra_trabajo", "title": "Encuentra trabajo",
        "steps": [
            intro('Encuentra <span class="o">trabajo</span>', "Cómo encontrar trabajo y postularte en Enganche."),
            pantalla("08_feed", "En Ofertas ves los trabajos cerca de ti, con la distancia y el valor. Puedes filtrar por tipo y nivel.",
                     "Ofertas <b>cerca de ti</b>", tap={"x": 50, "y": 69}, tapAt=4.2),
            pantalla("09_oferta_taller", "Abre la oferta para ver la cantidad, el área, las fechas y quién la publica. Si te sirve, toca Postularme.",
                     "Revisa y toca <b>Postularme</b>", tap={"x": 50, "y": 72.6}, tapAt=4.6),
            pantalla("10_oferta_postulado", "Listo. Quedas pendiente hasta que el autor elija.",
                     "Postulación <b>enviada</b>", focus={"x": 50, "y": 72, "s": 1.15}),
            pantalla("11_mis_postulaciones", "En Mis postulaciones sigues el estado de cada una.",
                     "Sigue tus <b>postulaciones</b>", focus={"x": 50, "y": 20, "s": 1.12}),
            OUTRO,
        ],
    },
    4: {
        "slug": "04_elige_y_coordina", "title": "Elige y coordina",
        "steps": [
            intro('Elige y <span class="o">coordina</span>', "Cómo elegir con quién trabajar en Enganche."),
            pantalla("12_oferta_postulantes", "En tu oferta ves quién se postuló. Revisa su perfil y toca Elegir.",
                     "Revisa y toca <b>Elegir</b>", tap={"x": 82, "y": 77}, tapAt=3.0),
            pantalla("13_perfil_postulante", "El perfil muestra la experiencia, los trabajos completados y las calificaciones.",
                     "Perfil y <b>reputación</b>", focus={"x": 50, "y": 15, "s": 1.15}),
            pantalla("14_oferta_elegido", "Al elegir, se abre el chat. Ahí se revelan los celulares.",
                     "Se abre el <b>chat</b>", tap={"x": 26, "y": 84.4}, tapAt=1.8),
            pantalla("15_chat", "Coordina fechas, ubicación y detalles directamente en el chat.",
                     "Coordina por <b>chat</b>", focus={"x": 50, "y": 20, "s": 1.1}),
            OUTRO,
        ],
    },
    5: {
        "slug": "05_cierra_el_trabajo", "title": "Cierra el trabajo",
        "steps": [
            intro('Cierra el <span class="o">trabajo</span>', "Cómo cerrar un trabajo en Enganche."),
            pantalla("14_oferta_elegido", "Cuando el trabajo esté listo, toca Marcar trabajo completado.",
                     "Toca <b>Marcar trabajo completado</b>", tap={"x": 50, "y": 89.6}, tapAt=1.8),
            pantalla("17b_completado_empresa_completo", "Califica a quien hizo el trabajo. Ambos se califican y la reputación de cada uno crece.",
                     "Califica el <b>trabajo</b>", scroll=True),
            pantalla("18_completado_taller", "Quien hizo el trabajo paga una comisión del tres por ciento. Durante tu periodo gratis, la comisión es cero.",
                     "Comisión del <b>3%</b>", focus={"x": 50, "y": 78, "s": 1.15}),
            pantalla("19_mi_perfil_taller", "Cada trabajo completado suma a tu perfil y a tu reputación en el gremio.",
                     "Tu <b>reputación</b> crece", focus={"x": 50, "y": 30, "s": 1.12}),
            OUTRO,
        ],
    },
}


def tts(text, path):
    body = json.dumps({"text": text, "model_id": "eleven_multilingual_v2",
                       "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}).encode()
    req = urllib.request.Request(
        f"{API}/text-to-speech/{VOICE_ID}?output_format=mp3_44100_128", data=body,
        headers={"xi-api-key": KEY, "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as r, open(path, "wb") as f:
        f.write(r.read())


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def srt_time(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def voz(text, audio_dir):
    """Genera (o reutiliza) el audio de una frase, con pausa al final."""
    h = hashlib.sha1((VOICE_ID + text).encode()).hexdigest()[:12]
    raw, pad = os.path.join(audio_dir, f"{h}_raw.mp3"), os.path.join(audio_dir, f"{h}.mp3")
    if not os.path.exists(pad):
        tts(text, raw)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-af", f"apad=pad_dur={PAD}",
                        "-c:a", "libmp3lame", "-b:a", "160k", pad], check=True)
    return pad


def construir(num, cfg):
    audio_dir = os.path.join(HERE, "audio")
    out_dir = os.path.join(HERE, "videos")
    frames = os.path.join(HERE, f"frames_{num}")
    os.makedirs(audio_dir, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)
    subprocess.run(["rm", "-rf", frames], check=True)
    os.makedirs(frames)

    pistas, tl, srt, t0 = [], [], [], 0.0
    for st in cfg["steps"]:
        a = voz(st["voz"], audio_dir)
        d = duration(a)
        if st["type"] == "outro":
            d += 0.8
        pistas.append((a, d))
        tl.append({"start": round(t0, 3), "end": round(t0 + d, 3)})
        srt.append(f"{len(srt) + 1}\n{srt_time(t0 + 0.05)} --> {srt_time(t0 + d - PAD)}\n{st['voz']}\n")
        t0 += d
    total = t0

    intro_step = cfg["steps"][0]
    conf = {
        "num": num, "total": len(VIDEOS), "title": cfg["title"],
        "introTitle": intro_step["title_html"], "introSub": INTRO_SUB,
        "steps": [{k: v for k, v in s.items() if k != "voz"} for s in cfg["steps"]],
        "tl": tl,
    }
    with open(os.path.join(HERE, "explainer.html"), encoding="utf-8") as f:
        html = f.read().replace("__CONFIG__", json.dumps(conf, ensure_ascii=False))
    page = os.path.join(HERE, f"explainer_{num}.html")
    with open(page, "w", encoding="utf-8") as f:
        f.write(html)

    n = int(round(total * FPS))
    per = (n + WORKERS - 1) // WORKERS
    procs = [subprocess.Popen(["node", os.path.join(HERE, "render_frames.js"), page, frames,
                               str(w * per), str(min(n, (w + 1) * per)), str(FPS)], stdout=subprocess.DEVNULL)
             for w in range(WORKERS) if w * per < n]
    if any(p.wait() != 0 for p in procs):
        sys.exit(f"falló el render del video {num}")

    # Audio: cada frase dura exactamente lo de su escena (el cierre se alarga con silencio)
    lista = os.path.join(audio_dir, f"lista_{num}.txt")
    partes = []
    for i, (a, d) in enumerate(pistas):
        seg = os.path.join(audio_dir, f"v{num}_{i}.wav")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", a, "-af", f"apad=whole_dur={d:.3f}", "-t", f"{d:.3f}",
                        "-ar", "44100", "-ac", "2", seg], check=True)
        partes.append(seg)
    with open(lista, "w") as f:
        f.writelines(f"file '{p}'\n" for p in partes)
    voz_final = os.path.join(audio_dir, f"v{num}.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", voz_final], check=True)

    final = os.path.join(out_dir, f"enganche_{cfg['slug']}.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", os.path.join(frames, "f_%05d.png"),
                    "-i", voz_final, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
                    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", final],
                   check=True)
    with open(final.replace(".mp4", ".srt"), "w", encoding="utf-8") as f:
        f.write("\n".join(srt))
    print(f"video {num}: {final} ({duration(final):.1f}s)")


def main():
    if not KEY:
        sys.exit("ELEVENLABS_API_KEY no está definida")
    nums = [int(x) for x in sys.argv[1:]] or sorted(VIDEOS)
    for n in nums:
        construir(n, VIDEOS[n])


if __name__ == "__main__":
    main()
