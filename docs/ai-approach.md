# AI features (Phase 5–6) — approach notes (DRAFT, for later discovery)

Status: **not built.** Owner intent (2026-06-26): *"a local model trained on my mom's documents."*
This note captures an honest framing so Phase 5 starts from the right place. Decide for real at
the Phase 5 gate (with costs + hardware).

## The two AI features (kept separate, per the brief)
- **§4 Teaching-structure generator** — she describes a lesson; it returns the *exact existing
  materials* + an order. This is **retrieval over her catalog**, not general chat.
- **§6 Exam generator** — builds exams in *her* style, grounded on her real past exams.

## "Trained on her documents" — the important distinction

Most people mean "the AI should *know* and *use* her documents." There are two very different ways:

1. **Fine-tuning / actually training a model on her docs.**
   - Bakes content into the model's weights. Needs lots of examples, is costly, and must be
     re-done every time she adds/edits a material.
   - For "point me to the exact material" or "match my exam style," this is usually the **wrong
     tool** — it's imprecise and stale.

2. **Retrieval-Augmented Generation (RAG) — recommended.**
   - The model stays general. At query time we **fetch the relevant pieces** of her catalog/exams
     and hand them to the model as context.
   - Updates **instantly** when she adds content; far more accurate for "use *these* materials";
     cheaper. This is exactly what the brief described (§4 "retrieval over her catalog", §6
     "examples-as-context / retrieval").
   - **Recommendation:** build RAG. (Light fine-tuning could *later* nudge the exam-writing
     *style*, on top of RAG — optional, not the foundation.)

## "Local model" — the privacy/cost fork (brief §7 q11)

Wanting it private (minors' content, her IP) is legitimate. Options, honestly:

| Option | Privacy | Quality | Cost / hardware | Fits non-technical owner? |
|---|---|---|---|---|
| **Truly local LLM** (Ollama + Llama/Qwen/Mistral, local embeddings) | Highest — data never leaves a machine you control | Lower than frontier models; depends on hardware | Needs a real machine (RAM/GPU); always-on; ops burden | Worst — someone must run/maintain a box |
| **Cloudflare Workers AI + Vectorize** | High-ish (stays in Cloudflare, our stack) | Good open models, hosted | Cheap, pay-per-use, **no hardware**; fits our serverless stack | Best ops fit |
| **Privacy-guaranteed API** (e.g. Claude with no-train data policy) | Data leaves the building, but not used for training | Highest quality | Pay-per-use | Easy, but data does egress |

**Tension to flag:** a *truly local* LLM does **not** fit the Cloudflare serverless hosting we
chose, and conflicts with "optimize for a non-technical owner" (it needs a maintained machine).
If "private" is the real goal more than "physically local," **Workers AI + Vectorize** likely
gives ~the same privacy posture with none of the hardware/ops burden, and stays on our stack.

## Likely Phase 5 shape (regardless of model choice)
1. **Ingest** her materials/exams → chunk → **embed** → store vectors (Cloudflare Vectorize or a
   local vector store).
2. **Retrieve** top matches at query time.
3. **Generate** the lesson plan / exam from retrieved context with the chosen model.
The *model* is a swappable piece behind this pipeline — so we can start with one and change later.

## Decisions (2026-06-26) — clarified vision

A **separate offline desktop tool on her laptop** (NOT part of the web app). She picks a
subject; it finds her most similar past exams, extracts their **structure** (sections, item
count, point distribution, question types, rubric), and generates a **fresh exam in that same
format** with new content. Same idea for lesson structure (§4). Confirmed answers:

- **Laptop:** typical / mid-range (≈8–16 GB RAM, **no dedicated GPU**).
- **Privacy:** **fully offline only** — nothing leaves the laptop.
- **Documents:** a **mix of digital + paper** (paper needs scanning + OCR).

## Recommended offline build

- **LLM runtime:** Ollama (offline). Model sized to the laptop: a 7–8B instruct model
  (e.g. Qwen2.5-7B / Llama-3.1-8B) quantized (~Q4) on 16 GB; drop to a 3–4B model on 8 GB.
- **Embeddings (offline):** a small multilingual model good at Romanian (e.g. bge-m3 / e5).
- **Vector store:** local (SQLite + a vector extension, or LanceDB). No cloud.
- **OCR (offline):** Tesseract + Romanian language data for **printed/typed** scans.
- **Doc parsing:** .docx + PDF text extraction; OCR only for scans.
- **App shell:** packaged Windows app (lean toward a Python core for the LLM/OCR/embeddings glue
  + a simple local UI reusing our design system). One-click for a non-technical user.
- **The killer trick:** derive an explicit **exam template** from her past papers (deterministic
  structure) and feed 1–3 retrieved past exams as examples. This means most of the "intelligence"
  is in *her own documents*, so even a small offline model produces on-format drafts.

## Honest expectations (this combo is the hard one)

- **Quality = good draft she edits**, not perfect final. RAG + template grounding makes structure
  reliable; wording from a small offline model is decent in Romanian but not frontier-level.
- **Speed:** tens of seconds per generation on CPU (no GPU). Workable, not instant.
- **Handwritten OCR is the weak spot:** offline OCR handles *printed/typed* Romanian well, but
  **handwritten** exams are unreliable offline — those may need typing up or a manual step.
- If quality ever disappoints, the build is model-agnostic — swapping in a private API later is a
  small change (but breaks "fully offline"; that's the owner's call).

## Status
Phase 5–6, **deferred**. Build the web platform first (owner's stated order). This tool is a
separate track; capture decisions now, build later.
