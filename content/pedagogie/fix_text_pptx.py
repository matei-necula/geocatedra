# Corectează text într-un .pptx fără să atingă formatarea.
#
# PowerPoint sparte des un cuvânt în mai multe <a:t> (corectorul ortografic
# lasă urme: 'v' + 'limatice'), deci o simplă căutare într-un run nu ajunge.
# Lucrăm la nivel de paragraf <a:p>: concatenăm runurile, căutăm acolo, apoi
# scriem înlocuirea în primul run atins și ștergem restul potrivirii din
# runurile următoare. Stilurile rămân exact cum erau.
import re, shutil, sys, zipfile
from html import escape, unescape

T = re.compile(r"<a:t>(.*?)</a:t>", re.S)
P = re.compile(r"<a:p>.*?</a:p>", re.S)


def fix_paragraph(para: str, old: str, new: str):
    """Întoarce (paragraf_nou, n_inlocuiri)."""
    spans = [(m.start(1), m.end(1), unescape(m.group(1))) for m in T.finditer(para)]
    if not spans:
        return para, 0
    joined = "".join(s[2] for s in spans)
    if old not in joined:
        return para, 0

    # harta: pozitie in `joined` -> (index run, offset in run)
    starts, acc = [], 0
    for i, (_, _, txt) in enumerate(spans):
        starts.append(acc)
        acc += len(txt)

    texts = [s[2] for s in spans]
    count = 0
    while True:
        joined = "".join(texts)
        at = joined.find(old)
        if at < 0:
            break
        count += 1
        end = at + len(old)
        # recalculăm începuturile, textele s-au putut scurta
        starts, acc = [], 0
        for t in texts:
            starts.append(acc)
            acc += len(t)
        out = []
        for i, t in enumerate(texts):
            lo, hi = starts[i], starts[i] + len(t)
            if hi <= at or lo >= end:  # run neatins
                out.append(t)
                continue
            a = max(at, lo) - lo           # început tăiere în run
            b = min(end, hi) - lo          # sfârșit tăiere în run
            piece = t[:a] + (new if lo <= at < hi else "") + t[b:]
            out.append(piece)
        texts = out

    # rescriem paragraful cu textele noi
    res, prev = [], 0
    for (s, e, _), t in zip(spans, texts):
        res.append(para[prev:s])
        res.append(escape(t, quote=False))
        prev = e
    res.append(para[prev:])
    return "".join(res), count


def fix_slide(xml: str, old: str, new: str):
    total = 0
    out, prev = [], 0
    for m in P.finditer(xml):
        para, n = fix_paragraph(m.group(0), old, new)
        total += n
        out.append(xml[prev:m.start()])
        out.append(para)
        prev = m.end()
    out.append(xml[prev:])
    return "".join(out), total


def apply(path: str, edits, dry=False):
    """edits: listă de (nr_slide, vechi, nou). Întoarce dict slide->n."""
    zin = zipfile.ZipFile(path)
    names = zin.namelist()
    data = {n: zin.read(n) for n in names}
    zin.close()
    report = {}
    for slide_no, old, new in edits:
        key = f"ppt/slides/slide{slide_no}.xml"
        if key not in data:
            report[(slide_no, old)] = "SLIDE INEXISTENT"
            continue
        xml = data[key].decode("utf8")
        fixed, n = fix_slide(xml, old, new)
        report[(slide_no, old)] = n
        if n:
            data[key] = fixed.encode("utf8")
    if not dry and any(isinstance(v, int) and v > 0 for v in report.values()):
        shutil.copy2(path, path + ".bak")
        zout = zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED)
        for n in names:
            zout.writestr(n, data[n])
        zout.close()
    return report
