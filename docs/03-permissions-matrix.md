# Role × Permission × Material Matrix

Status: **Phase 0 — proposed.** All decisions here are **enforced server-side** (Workers),
never by hiding UI. The frontend only reflects what the backend already decided.

## Roles

| Role | Account? | How they get in | Pays? |
|---|---|---|---|
| **Admin** (the teacher / your mother) | Yes | Login | No |
| **Student** | **No** | Shared class **token** | No (free, taught by her) |
| **Teacher** (other teachers) | Yes | Login + subscription | Yes |
| **Public** ("anyone else") | Yes | Login + subscription and/or pay-per-material | Yes |

## What each role may do

| Capability | Admin | Student | Teacher | Public |
|---|:--:|:--:|:--:|:--:|
| Browse full catalog (all grades) | ✅ | ❌ (only own grade) | ✅ student library | ❌ (sees locked) |
| View a material's content | ✅ | ✅ within token's grade | ✅ (view-only) | ✅ only if bought/subscribed; teasers free |
| Download / export raw files | ✅ | ❌ | ❌ | ❌ |
| Generate student tokens | ✅ | ❌ | ✅ for own classes | ❌ |
| Add / edit / organize materials | ✅ | ❌ | ❌ | ❌ |
| See **Student materials** library | ✅ | ✅ (own grade) | ✅ | partial (locked + teasers) |
| See **Teacher (pedagogy)** library | ✅ | ❌ | ✅ **only with pedagogy tier** | ❌ |

## Visibility states a material can take (per viewer)

- **Full** — content rendered/streamed (watermarked for students).
- **View-only** — rendered but no download affordances + server refuses raw-file requests (teachers).
- **Teaser** — a small set flagged `is_teaser` shown free to public.
- **Locked** — metadata/cover visible, content refused server-side, with an upsell (public).
- **Hidden** — not returned by the API at all (e.g. another grade's material to a student;
  draft material to anyone but admin).

## Resolution rule (pseudo, enforced in Workers)

```
visibility(viewer, material):
  if material.status == 'draft' and viewer.role != 'admin': return HIDDEN
  switch viewer.role:
    admin:    return FULL
    student:  if material.library=='student'
                 and material.topic.grade == viewer.token.grade
                 and token is valid & not revoked & within validity window:
                   return FULL (watermarked)
              else: return HIDDEN
    teacher:  if material.library=='teacher' and not viewer.has(pedagogy_tier): return LOCKED
              if viewer.subscription active: return VIEW_ONLY
              else: return LOCKED
    public:   if material.library=='teacher': return HIDDEN
              if material.is_teaser: return TEASER
              if viewer.entitled(material) or viewer.subscription active: return FULL
              else: return LOCKED
```

Every content/asset endpoint calls this resolver **before** returning anything. The student
path additionally re-checks the token scope on each request and stamps the watermark code.
