#!/usr/bin/env python3
"""Video de lanzamiento de Enganche con Luci, la modelo oficial (9:16): foto de Luci + pantallas reales + voz en off."""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from build_explainers import FPS, KEY, WORKERS, duration, srt_time, voz  # noqa: E402

# Una frase por escena (en el mismo orden que las secciones e0..e7 de launch.html)
VOZ = [
    "Les dijimos que algo se estaba armando para el gremio del aluminio y el vidrio. Ya llegó.",
    "Enganche. Aluminio y vidrio, conectados.",
    "Si tienes un proyecto, publica lo que necesitas producir o instalar, con tu precio.",
    "Si instalas o tienes taller, encuentra trabajo cerca de ti y postúlate.",
    "Tú eliges con quién, y se enganchan a trabajar.",
    "Solo con tu celular, con calificaciones y treinta días de garantía, en todo Colombia.",
    "Enganche. Publica, postúlate y contrata. Entra gratis con tu celular.",
]
EXTRA = {0: 0.3, 1: 0.3, 6: 1.3}  # respiro en la apertura, tras el logo y en el cierre


def main():
    if not KEY:
        sys.exit("ELEVENLABS_API_KEY no está definida")
    audio_dir = os.path.join(HERE, "audio")
    frames = os.path.join(HERE, "frames_luci")
    out_dir = os.path.join(HERE, "videos")
    os.makedirs(audio_dir, exist_ok=True)
    os.makedirs(out_dir, exist_ok=True)
    subprocess.run(["rm", "-rf", frames], check=True)
    os.makedirs(frames)

    pistas, tl, srt, t0 = [], [], [], 0.0
    for i, texto in enumerate(VOZ):
        a = voz(texto, audio_dir)
        d = duration(a) + EXTRA.get(i, 0)
        pistas.append((a, d))
        tl.append({"start": round(t0, 3), "end": round(t0 + d, 3)})
        srt.append(f"{i + 1}\n{srt_time(t0 + 0.05)} --> {srt_time(t0 + d - 0.3)}\n{texto}\n")
        t0 += d

    with open(os.path.join(HERE, "launch_luci.html"), encoding="utf-8") as f:
        html = f.read().replace("__TIMELINE__", json.dumps(tl))
    page = os.path.join(HERE, "launch_luci_built.html")
    with open(page, "w", encoding="utf-8") as f:
        f.write(html)

    n = int(round(t0 * FPS))
    per = (n + WORKERS - 1) // WORKERS
    procs = [subprocess.Popen(["node", os.path.join(HERE, "render_frames.js"), page, frames,
                               str(w * per), str(min(n, (w + 1) * per)), str(FPS)], stdout=subprocess.DEVNULL)
             for w in range(WORKERS) if w * per < n]
    if any(p.wait() != 0 for p in procs):
        sys.exit("falló el render del lanzamiento con Luci")

    partes = []
    for i, (a, d) in enumerate(pistas):
        seg = os.path.join(audio_dir, f"luci_{i}.wav")
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", a, "-af", f"apad=whole_dur={d:.3f}", "-t", f"{d:.3f}",
                        "-ar", "44100", "-ac", "2", seg], check=True)
        partes.append(seg)
    lista = os.path.join(audio_dir, "lista_luci.txt")
    with open(lista, "w") as f:
        f.writelines(f"file '{p}'\n" for p in partes)
    voz_final = os.path.join(audio_dir, "luci.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", voz_final], check=True)

    final = os.path.join(out_dir, "enganche_lanzamiento_luci.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", os.path.join(frames, "f_%05d.png"),
                    "-i", voz_final, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
                    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", final],
                   check=True)
    with open(final.replace(".mp4", ".srt"), "w", encoding="utf-8") as f:
        f.write("\n".join(srt))
    print(f"lanzamiento con Luci: {final} ({duration(final):.1f}s)")


if __name__ == "__main__":
    main()
