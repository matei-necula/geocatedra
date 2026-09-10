import type { SubjectConfig } from "./types";
import { mindmaps } from "./mindmaps";

// ============================================================================
// SUBJECT INSTANCE: Geography (instance #1)
// This is the ONLY place "geography" lives. The engine reads this file.
// To create a new subject (e.g. biology) you swap this config + seed content.
// ============================================================================

export const subjectConfig: SubjectConfig = {
	instanceId: "geografie",
	siteName: "Geo-catedra",
	logoText: "G",
	tagline: "Geografia, toată într-un singur loc.",
	defaultLocale: "ro",
	locales: ["ro"],
	// Adresă dedicată pe domeniul propriu (2026-09-07), NU adresa personală a autoarei.
	// Cutia nu există: e o redirectare Cloudflare Email Routing către adresa ei privată,
	// deci se primesc mesaje, dar nu se poate trimite de pe ea. Câmpul plin aprinde deodată
	// `mailto:`-ul din subsol, din `/confidentialitate` și din `/.well-known/security.txt`
	// — vezi `components/site.tsx`. Gol = rezerva onestă, fără adresă publicată.
	contactEmail: "contact@geocatedra.com",

	// Autoarea. Numele e nume propriu, deci stă aici direct; restul textelor sunt chei de
	// traducere, ca orice text de interfață (vezi `AuthorDef` din config/types.ts).
	//
	// **Biografia de mai jos spune STRICT ce se poate verifica din chiar conținutul sitului**
	// — materialele publicate, rafturile, studiile de caz din Dobrogea. Nu conține ani de
	// vechime, școală sau grade didactice, fiindcă nimeni în afară de doamna profesoară nu le
	// poate confirma, iar o pagină „Despre autoare" cu date inventate ar strica exact semnalul
	// de încredere pentru care există. Când le dă, se adaugă drept chei noi în
	// `credentialKeys` — pagina le randează singură, fără modificare de cod.
	author: {
		name: "Liliana Necula",
		roleKey: "author.role",
		bioKeys: ["author.bio.1", "author.bio.2", "author.bio.3"],
		credentialKeys: ["author.cred.1", "author.cred.2", "author.cred.3"],
	},

	theme: {
		colors: {
			bg: "#FDF6EC",
			surface: "#FFFFFF",
			ink: "#22333B",
			muted: "#5C6B73",
			primary: "#2A6F97",
			"primary-strong": "#245F82",
			accent: "#E07A5F",
			// Închis de la #C85A3F (2026-09-05): ca TEXT pe crem dădea 3,92:1, sub pragul de
			// 4,5. Acum 4,68:1. Ca umplere n-a fost niciodată o problemă — doar ca text.
			"accent-strong": "#B84E34",
			sand: "#F2CC8F",
			border: "rgba(34,51,59,0.12)",
			// Textul de pe umpluturile de temă.
			//
			// `on-accent` NU e alb: alb pe teracota #E07A5F dă 2,83:1, adică un buton
			// inaccesibil — și era exact ce scria `text-white` pe butonul „Aruncă o privire"
			// de pe pagina de start. Cerneala temei dă 4,44:1, tot sub prag, deci textul e
			// puțin mai închis decât `ink`: 4,87:1.
			"on-primary": "#FFFFFF",
			"on-accent": "#1D2C33",
		},
		colorsDark: {
			bg: "#14202A",
			surface: "#1C2B36",
			ink: "#E7EDF0",
			muted: "#9DB0BA",
			primary: "#4F9BC7",
			"primary-strong": "#3D87B2",
			accent: "#E8917A",
			"accent-strong": "#D2755C",
			sand: "#C9A86B",
			border: "rgba(231,237,240,0.14)",
			// În mod întunecat umpluturile sunt DESCHISE, deci textul de pe ele trebuie să fie
			// închis. Alb pe primarul #4F9BC7 dădea 3,07:1 și pe accentul #E8917A 2,40:1 —
			// ambele inaccesibile. Cu cerneala fundalului: 5,39:1 și 6,90:1.
			"on-primary": "#14202A",
			"on-accent": "#14202A",
		},
		fonts: {
			heading: '"Spectral", Georgia, serif',
			body: '"Inter", ui-sans-serif, system-ui, sans-serif',
		},
		motif: "contours",
	},

	// ==========================================================================
	// „Cobalt" — identitatea instanței libere (`catedra-liber`), 2026-09-05.
	//
	// Alese de `themeFor()` doar când `CLOUDFLARE_ENV=liber`. Instanța cu clase nu vede
	// niciodată obiectul ăsta, deci paleta de mai sus rămâne intactă.
	//
	// Contrastele sunt CALCULATE (WCAG 2.1), nu alese din ochi. Două ies din calcul, nu
	// din gust, și de-aia arată „ciudat" la prima vedere:
	//
	//  1. Coralul `#FF6A4D` dă 2,64:1 pe hârtie — pică și pragul de text (4,5), și pe cel
	//     de element non-text (3,0). Deci e UMPLERE, niciodată text pe fundal deschis:
	//     butonul coral poartă text `ink` (6,33:1). Coral ca TEXT = `accent-strong`.
	//  2. În modul întunecat, alb pe primarul `#6E8FF5` dă 3,04:1. Am verificat și
	//     varianta „închidem primarul ca să treacă albul": `#3557D4` dă 6,06:1 cu alb, dar
	//     cade la 3,12:1 față de fundal, adică butonul dispare din pagină. Soluția e
	//     primar luminos + text închis — de aici `on-primary` închis, nu alb.
	//
	// Valorile exacte sunt verificate de `lib/contrast.test.ts`, nu de comentariul ăsta.
	// ==========================================================================
	themeLiber: {
		colors: {
			// Fundalul e PERGAMENT CALD, nu alb-albăstrui (2026-09-05).
			//
			// Prima variantă era `#F6F7FB`, la 6,9% sub alb — adică fundalul și suprafața
			// cardurilor difereau cu aproape nimic. Cardurile nu se mai citeau ca niște
			// carduri, iar pagina arăta plată și strident de deschisă. Acum separarea e de
			// 15,2%: cardurile albe se ridică vizibil de pe pagină, fără nicio umbră în plus.
			//
			// Cald, nu rece: hârtie caldă sub cerneală cobalt e perechea clasică de planșă
			// tipărită, și leagă instanța liberă de cremul celei cu clase fără să-l copieze.
			bg: "#F0EDE6",
			surface: "#FFFFFF",
			ink: "#10162B",
			muted: "#4A5573",
			primary: "#1B3FBF",
			"primary-strong": "#16339B",
			accent: "#FF6A4D",
			// Închis de la #BD4E39: pe pergament dădea 4,16:1, sub prag. Acum 4,67:1.
			"accent-strong": "#B24734",
			// `sand` desenează motivul de fundal, deci e o nuanță de hârtie, nu de cerneală.
			sand: "#D6CDBA",
			border: "rgba(16,22,43,0.14)",
			"on-primary": "#FFFFFF",
			"on-accent": "#10162B",
		},
		colorsDark: {
			// Ridicat de la #0B1020: era aproape negru, iar pagina părea o gaură. Acum e un
			// bleumarin adânc, cu suprafața cardurilor cu 48% mai deschisă decât fundalul —
			// aceeași adâncime ca în modul luminos.
			bg: "#111726",
			surface: "#1B2334",
			ink: "#E8ECF6",
			muted: "#98A3BD",
			primary: "#6E8FF5",
			"primary-strong": "#5A7CE8",
			accent: "#FF8368",
			"accent-strong": "#FF8368",
			sand: "#2A3550",
			border: "rgba(232,236,246,0.16)",
			"on-primary": "#111726",
			"on-accent": "#111726",
		},
		fonts: {
			heading: '"Instrument Serif", Georgia, serif',
			headingUi: '"Public Sans", ui-sans-serif, system-ui, sans-serif',
			body: '"Public Sans", ui-sans-serif, system-ui, sans-serif',
		},
		// Fundalul are textură pe amândouă instanțele. `SiteBackdrop` (randat o dată din
		// `root.tsx`) desenează curbele în culorile temei active, deci același motiv arată
		// cobalt aici și azuriu pe instanța cu clase — fără nicio ramificație.
		motif: "contours",
	},

	// Romanian schooling: doar liceu (clasele 9–12) — gimnaziul (5–8) a fost scos din taxonomie.
	// Conținutul deja existent în bază pentru clasele 5–8 (dacă există) rămâne neatins, dar
	// devine inaccesibil din interfață: `gradeById` nu mai găsește acele clase.
	cycles: [
		{
			id: "liceu",
			label: "Liceu",
			gradeIds: ["9", "10", "11", "12"],
			display: "expanded",
		},
	],

	grades: [
		{ id: "9", label: "Clasa a 9-a", cycle: "liceu" },
		{ id: "10", label: "Clasa a 10-a", cycle: "liceu", noticeKey: "grade.notice.pending_curriculum" },
		{ id: "11", label: "Clasa a 11-a", cycle: "liceu", noticeKey: "grade.notice.pending_curriculum" },
		{ id: "12", label: "Clasa a 12-a", cycle: "liceu", noticeKey: "grade.notice.pending_curriculum" },
	],

	// Ordinea temelor urmează programa (CAP. I → VIII), cum a scris-o doamna profesoară —
	// nu ordinea în care au fost adăugate în admin. Slug-urile NU s-au schimbat (sunt cheia
	// din DB / URL); s-a schimbat doar ordinea din array și, la două teme, formularea etichetei.
	topics: {
		"9": [
			{ slug: "pamantul-reprezentare-harti", label: "Reprezentarea spațiului geografic. Utilizarea reprezentărilor cartografice" },
			{ slug: "universul-partea-1", label: "Universul" },
			{ slug: "universul-partea-2", label: "Sistemul Solar" },
			{ slug: "pamantul-caracteristici", label: "Proprietăți fizice ale Terrei" },
			{ slug: "pamantul-miscari", label: "Mișcările fundamentale ale Pământului" },
			{ slug: "dinamica-litosferei", label: "Dinamica internă a Terrei și fenomene asociate" },
			{ slug: "tipuri-de-roci", label: "Alcătuirea litosferei – minerale și roci" },
			{ slug: "relieful-major", label: "Relieful major" },
			{ slug: "relieful-minor", label: "Relieful minor (modelat de agenții externi)" },
			{ slug: "atmosfera-caracteristici-climatice", label: "Atmosfera și caracteristicile climatice" },
			{ slug: "climatele-terrei", label: "Climatele Terrei" },
			{ slug: "hidrosfera", label: "Hidrosfera – apele Pământului" },
			{ slug: "zonele-biogeografice", label: "Biosfera. Diferențieri regionale" },
			{ slug: "solurile-terrei", label: "Solurile Terrei (pedosfera)" },
			{ slug: "mediile-naturale-terestre", label: "Mediile naturale terestre" },
		],
		"10": [],
		"11": [],
		"12": [],
	},

	// Concept maps (hărți conceptuale) per topic — see ./mindmaps.ts.
	mindmaps,

	// Extensible: add a type here + a renderer branch + (later) an ingest skill.
	// `art` = motivul desenat pe cardurile fără fotografie proprie (vezi `lib/card-art.ts`).
	// Motorul cunoaște doar forme generice; legătura „lecție scrisă = carte deschisă" e o
	// decizie a instanței, deci stă aici.
	materialTypes: [
		{ key: "video", icon: "▶", labelKey: "type.video", art: "film" },
		{ key: "scris", icon: "✎", labelKey: "type.scris", art: "book" },
		{ key: "joc", icon: "✦", labelKey: "type.joc", art: "compass" },
		{ key: "examen", icon: "✓", labelKey: "type.examen", art: "check" },
		{ key: "foto", icon: "◑", labelKey: "type.foto", art: "camera" },
		{ key: "prezentare", icon: "▤", labelKey: "type.prezentare", art: "layers" },
		{ key: "fisier", icon: "📎", labelKey: "type.fisier", art: "clip" },
		{ key: "interactiv", icon: "◆", labelKey: "type.interactiv", art: "spark" },
	],
	teacherCollections: [
		{
			slug: "scheme-de-lectie",
			labelKey: "teacher.collection.scheme.label",
			descKey: "teacher.collection.scheme.desc",
			singularKey: "teacher.collection.scheme.one",
		},
		{
			slug: "ghid-metodologic",
			labelKey: "teacher.collection.ghid.label",
			descKey: "teacher.collection.ghid.desc",
			singularKey: "teacher.collection.ghid.one",
		},
		{
			slug: "proiecte-de-lectie",
			labelKey: "teacher.collection.proiecte.label",
			descKey: "teacher.collection.proiecte.desc",
			singularKey: "teacher.collection.proiecte.one",
		},
		{
			slug: "studii-de-caz-dobrogea",
			labelKey: "teacher.collection.dobrogea.label",
			descKey: "teacher.collection.dobrogea.desc",
			singularKey: "teacher.collection.dobrogea.one",
		},
		{
			slug: "teste-model",
			labelKey: "teacher.collection.teste.label",
			descKey: "teacher.collection.teste.desc",
			singularKey: "teacher.collection.teste.one",
		},
	],

	// Vitrina publică — vezi docs/superpowers/specs/2026-08-20-demo-public-design.md.
	// Fiecare material de elev e din altă temă, ca vitrina să arate lățimea bibliotecii.
	demo: {
		quizGradeId: "9",
		quizLength: 7,
		student: [
			{ gradeId: "9", slug: "hidrosfera-apele-pamantului" },        // lecție scrisă
			{ gradeId: "9", slug: "zonele-biogeografice-galerie-foto" },  // fotografii
			{ gradeId: "9", slug: "muntii-lumii-pe-harta" },              // joc interactiv
		],
		teacher: [
			{ gradeId: "9", slug: "schema-climatele-terestre" },          // schemă de lecție
			{ gradeId: "9", slug: "ghid-relieful-extern" },               // ghid metodologic
		],
	},

	strings: {
		"role.students": "Elevi",
		"role.students.desc":
			"Intri cu parola primită de la doamna profesoară și vezi materia clasei tale.",
		"role.students.cta": "Intră cu token",
		"role.teachers": "Profesori",
		"role.teachers.desc":
			"Vezi materialele, generează tokenuri pentru clase și accesează biblioteca de pedagogie.",
		"role.teachers.cta": "Cont de profesor",
		"role.public": "Public",
		"role.public.desc":
			"Explorează catalogul, cu materiale demonstrative gratuite și acces plătit.",
		"role.public.cta": "Vezi catalogul",
		"soon": "În curând",
		"soon.desc":
			"Această secțiune se construiește acum. Experiența pentru elevi este prima la rând.",
		"type.video": "Lecție video",
		"type.scris": "Lecție scrisă",
		"type.joc": "Joc interactiv",
		"type.examen": "Model de examen",
		"type.foto": "Fotografii",
		"type.prezentare": "Prezentare",
		"type.fisier": "Fișier / document",
		"type.interactiv": "Aplicație interactivă",
		"student.enter.title": "Intră cu tokenul clasei",
		"student.enter.help":
			"Scrie parola primită de la doamna profesoară. Îți deschide materialele clasei tale.",
		"student.enter.placeholder": "ex. GEO-9-XXXX",
		"student.enter.button": "Deschide materialele",
		"student.enter.error": "Token invalid sau expirat. Verifică parola și încearcă din nou.",
		"student.library": "Biblioteca clasei tale",
		"nav.back": "Înapoi",
		"teacher.home": "Acasă",
		"teacher.hub.title": "Bun venit",
		"teacher.hub.help": "Alege de unde începi.",
		"teacher.sections.aria": "Secțiuni",
		"teacher.section.clase.label": "Clasele mele",
		"teacher.section.clase.desc":
			"Tot ce pregătești pentru elevi: materialele de predat, tokenurile claselor, anunțuri, teme și note.",
		"teacher.section.pedagogie.label": "Pedagogie",
		"teacher.section.pedagogie.desc":
			"Materiale pentru tine: scheme de lecție și ghiduri metodologice, ca să predai mai ușor.",
		"teacher.group.clasa": "La clasă",
		"teacher.group.evaluare": "Evaluare",
		"teacher.tab.materiale": "Materiale elevi",
		"teacher.tab.materiale.desc": "Materialele pe care le văd elevii tăi. Doar vizualizare.",
		"teacher.tab.tokenuri": "Tokenuri",
		"teacher.tab.tokenuri.desc": "Generează parolele cu care intră clasele tale.",
		"teacher.tab.anunturi": "Anunțuri",
		"teacher.tab.anunturi.desc": "Scrie mesaje pe care le văd elevii unei clase.",
		"teacher.tab.teme": "Teme",
		"teacher.tab.teme.desc": "Dă teme cu întrebări alese de tine și vezi cine le-a rezolvat.",
		"teacher.tab.exerseaza": "Exersează",
		"teacher.tab.exerseaza.desc": "Încearcă testele grilă exact așa cum le văd elevii.",
		"teacher.tab.rezultate": "Rezultate",
		"teacher.tab.rezultate.desc": "Rezultatele claselor tale la teste și teme.",
		"teacher.tab.statistici": "Statistici",
		"teacher.tab.statistici.desc": "Ce materiale sunt deschise cel mai des de elevi.",
		"teacher.collection.scheme.label": "Scheme de lecție",
		"teacher.collection.scheme.desc": "Scheme gata de folosit la clasă.",
		"teacher.collection.ghid.label": "Ghid metodologic",
		"teacher.collection.ghid.desc": "Exemple de activități de învățare bazate pe competențe.",
		"teacher.collection.proiecte.label": "Proiecte de lecție",
		"teacher.collection.proiecte.desc": "Scenarii detaliate ale lecțiilor.",
		"teacher.collection.dobrogea.label": "Studii de caz — Dobrogea",
		"teacher.collection.dobrogea.desc": "Relieful, clima, apele și învelișul viu al Dobrogei, cu metode active de lucru la clasă.",
		"teacher.collection.teste.label": "Teste-model",
		"teacher.collection.teste.desc": "Teste sumative gata de dat la clasă, cu barem de notare și matrice de specificație.",
		// Numele UNUI material de pe raft, la singular — folosit de `learningResourceType` din
		// JSON-LD, care descrie pagina curentă, nu raftul. Eticheta raftului („Scheme de lecție")
		// pusă pe o pagină cu o singură schemă e o afirmație greșită despre ce e acea pagină.
		"teacher.collection.scheme.one": "Schemă de lecție",
		"teacher.collection.ghid.one": "Ghid metodologic",
		"teacher.collection.proiecte.one": "Proiect de lecție",
		"teacher.collection.dobrogea.one": "Studiu de caz",
		"teacher.collection.teste.one": "Test-model",
		"teacher.collection.empty": "Nu s-a adăugat încă niciun material aici. Revino în curând.",
		"nav.logout": "Ieși",
		"material.locked": "Conținut blocat",
		"admin.title": "Panou profesor (admin)",
		"admin.login.title": "Autentificare admin",
		"admin.login.button": "Intră",
		"admin.login.error": "Parolă incorectă.",
		"admin.tokens.generate": "Generează token pentru o clasă",
		"admin.tokens.label": "Etichetă (ex. „Clasa 6A 2025–2026”)",
		"admin.tokens.grade": "Clasa",
		"admin.tokens.create": "Generează token",
		"admin.tokens.existing": "Tokenuri existente",
		"admin.tokens.revoke": "Revocă",
		"admin.tokens.revoked": "Revocat",
		"admin.tokens.active": "Activ",
		"admin.tokens.valid_until": "Valabil până la",
		"admin.tokens.new_note":
			"Notează acest token acum — din motive de securitate nu îl vei mai putea vedea.",
		"footer.note": "O platformă pentru predare fără hârtii.",
		"admin.questions": "Întrebări",
		"admin.materials.no_topic": "Fără temă (verifică)",
		"admin.results": "Rezultate",
		"practice.cta": "Exersează",
		"practice.nickname": "Poreclă (nu numele real)",
		"practice.nickname_hint": "Alege un nume de cod, nu numele tău adevărat.",
		"practice.choose_topic": "Alege tema",
		"practice.whole_grade": "Toată clasa",
		"practice.length": "Câte întrebări",
		"practice.start": "Începe testul",
		"practice.submit": "Vezi rezultatul",
		"practice.again": "Generează alt test",
		"practice.correct_answer": "Răspuns corect",
		"practice.explanation": "Explicație",
		"practice.score": "Scor",
		"practice.grade_equiv": "Notă aproximativă",
		"practice.empty": "Nu există încă întrebări publicate pentru această clasă.",
		"practice.nickname_taken": "Porecla aceasta este deja folosită în clasa ta. Alege altă poreclă.",
		"practice.correct": "Răspuns corect",
		"practice.wrong": "Răspuns greșit",
		"practice.hint": "Indiciu",
		"practice.question": "Întrebarea",
		"practice.next": "Următoarea întrebare",
		"practice.previous_runs": "Exersări anterioare",
		"practice.js_required": "Activează JavaScript în browser ca să poți exersa.",
		"practice.mistakes_cta": "Exersează greșelile mele",
		"practice.mistakes_empty": "Nu ai greșeli salvate — exersează normal și revino aici dacă greșești.",
		"browse.search": "Caută în materiale…",
		"browse.filter_all": "Toate tipurile",
		"browse.no_results": "Niciun material nu se potrivește căutării.",
		"browse.clear": "Șterge filtrele",
		"browse.new_badge": "Nou",
		"browse.expand_all": "Deschide tot",
		"browse.collapse_all": "Închide tot",
		"browse.count.materials.one": "{n} material",
		"browse.count.materials.few": "{n} materiale",
		"browse.count.materials.many": "{n} de materiale",
		"browse.count.questions.one": "{n} întrebare",
		"browse.count.questions.few": "{n} întrebări",
		"browse.count.questions.many": "{n} de întrebări",
		"mindmap.panel": "Harta conceptuală",
		"mindmap.hint": "Ideile principale ale lecției, pe scurt. Apasă o ramură pentru detalii.",
		"mindmap.root_aria": "Hartă conceptuală pentru",
		"mindmap.branch_aria": "detalii",
		"mindmap.open_lesson": "Deschide lecția",
		"mindmap.shortcut": "Vezi harta conceptuală",
		"library.search": "Caută în toate materialele…",
		"library.no_results": "Niciun material nu se potrivește.",
		"library.filter_grade_all": "Toate clasele",
		"library.filter_status_all": "Publicate + ciorne",
		"library.filter_lib_all": "Ambele biblioteci",
		"announcements.title": "Anunțuri",
		"announcements.new": "Anunț nou",
		"announcements.body": "Textul anunțului",
		"announcements.target_all": "Toate clasele mele din acest an de studiu",
		"announcements.pinned": "Fixat sus",
		"announcements.expires": "Se ascunde după (opțional)",
		"announcements.publish": "Publică anunțul",
		"announcements.empty": "Niciun anunț încă. Scrie primul mai sus.",
		"announcements.expired": "expirat",
		"announcements.deleted_class": "clasă ștearsă",
		"announcements.save": "Salvează",
		"announcements.delete_confirm": "Ștergi acest anunț?",
		"announcements.student_title": "Anunțuri de la profesor",
		"announcements.show_all": "toate anunțurile",
		"assignments.title": "Teme",
		"assignments.new": "Temă nouă",
		"assignments.name": "Titlul temei",
		"assignments.due": "Termen (opțional)",
		"assignments.count": "Număr de întrebări",
		"assignments.topic_any": "Mix din tot anul de studiu",
		"assignments.create": "Creează tema",
		"assignments.empty": "Nicio temă încă.",
		"assignments.closed": "închisă",
		"assignments.close": "Închide",
		"assignments.close_confirm": "Închizi această temă? Elevii nu o vor mai vedea.",
		"assignments.delete_confirm": "Ștergi această temă? Rezultatele deja înregistrate rămân ca exercițiu.",
		"assignments.see_results": "Vezi rezultatele",
		"assignments.done": "rezolvat",
		"assignments.late": "întârziat",
		"assignments.due_by": "până la",
		"assignments.already_done": "Ai rezolvat deja această temă — acest test a fost exercițiu liber.",
		"assignments.roster_note": "Lista arată cine a rezolvat tema. Cine nu a rezolvat-o afli din catalogul tău — elevii sunt anonimi aici.",
		"stats.title": "Statistici",
		"stats.views_30": "Vizualizări în ultimele 30 de zile",
		"stats.top": "Cele mai vizitate materiale",
		"stats.per_class": "Activitate pe clase (30 de zile)",
		"stats.unviewed": "Materiale nevizitate",
		"stats.unviewed_sub": "Publicate pentru elevi, dar niciodată deschise",
		"stats.empty": "Nicio vizualizare încă. Statisticile apar după ce elevii deschid materiale.",
		"stats.practice_pointer": "Rezultatele testelor grilă sunt la „Rezultate”.",
		"results.release_nick": "Eliberează",
		"results.release_confirm": "Eliberezi această poreclă? Va putea fi folosită din nou.",
		"footer.copyright": "© {year} Liliana Necula. Materialele de pe această platformă sunt opere protejate de Legea nr. 8/1996 privind dreptul de autor și drepturile conexe. Reproducerea, redistribuirea sau publicarea lor fără acordul scris al autoarei este interzisă.",
		"footer.privacy": "Confidențialitate",
		"footer.terms": "Termeni și condiții",
		"footer.cookies": "Cookie-uri",
		// Accesibilitate: linkul de salt din antetul instanței libere (components/liber/LiberChrome.tsx).
		"a11y.skip": "Sari la conținut",
		// --- Păreri publice (/pareri pe site-ul liber, /admin/pareri la moderare) ---
		"reviews.title": "Păreri",
		"reviews.kicker": "Spune-ne ce crezi",
		// Banda de invitație de pe pagina de start a instanței libere (components/liber/HomeLiber.tsx).
		"reviews.invite.title": "Îți e de folos?",
		"reviews.invite.text":
			"Site-ul e făcut de o profesoară de geografie și e gratuit. Dacă ți-a fost util — sau dacă lipsește ceva — spune-ne în două rânduri.",
		"reviews.invite.cta": "Lasă o părere",
		"reviews.meta_desc":
			"Spune-ne ce ți se pare util și ce lipsește. Părerile apar pe sit doar după ce le citim.",
		"reviews.lead":
			"Materialele de aici se fac pentru oameni, așa că ne ajută mult să știm cum vă sunt de folos. Scrie-ne în câteva rânduri ce ți-a plăcut, ce nu merge sau ce lipsește.",
		"reviews.form.title": "Scrie o părere",
		"reviews.form.rating": "Cât de util ți s-a părut site-ul?",
		"reviews.form.role": "Cine ești?",
		"reviews.form.name": "Nume (opțional)",
		"reviews.form.name_placeholder": "Ana",
		"reviews.form.name_hint": "Scrie doar prenumele sau o poreclă — nu numele întreg.",
		"reviews.form.body": "Părerea ta",
		"reviews.form.body_placeholder": "Ce ți-a fost de folos? Ce ai schimba?",
		"reviews.form.submit": "Trimite părerea",
		"reviews.form.sending": "Se trimite…",
		"reviews.form.privacy":
			"Nu îți cerem e-mail, nu păstrăm adresa IP și nu punem niciun cookie. Rămân doar rolul, stelele, textul și numele pe care îl scrii tu — care poate fi o poreclă.",
		"reviews.form.honeypot": "Lasă câmpul acesta gol",
		"reviews.thanks":
			"Îți mulțumim! Am primit părerea ta. Apare pe sit după ce o citim — de obicei în câteva zile.",
		"reviews.rating.1": "1 stea",
		"reviews.rating.2": "2 stele",
		"reviews.rating.3": "3 stele",
		"reviews.rating.4": "4 stele",
		"reviews.rating.5": "5 stele",
		"reviews.role.elev": "Elev / elevă",
		"reviews.role.profesor": "Profesor / profesoară",
		"reviews.role.parinte": "Părinte",
		"reviews.role.altcineva": "Altcineva",
		"reviews.err.rating": "Alege câte stele dai, de la 1 la 5.",
		"reviews.err.role": "Alege cine ești.",
		"reviews.err.body_short": "Scrie măcar câteva cuvinte — cel puțin 10 caractere.",
		"reviews.err.body_long": "Textul e prea lung. Încape în cel mult 1000 de caractere.",
		"reviews.err.blocked": "Nu am putut trimite părerea acum. Mai încearcă peste un minut.",
		"reviews.list.title": "Ce spun ceilalți",
		"reviews.list.empty": "Încă nu e nicio părere publicată. Poți fi primul care scrie una.",
		"reviews.anonymous": "Anonim",
		"reviews.admin.pending": "În așteptare",
		"reviews.admin.published": "Publicate",
		"reviews.admin.rejected": "Respinse",
		"reviews.admin.empty_pending": "Nicio părere nouă de citit.",
		"reviews.admin.empty_published": "Nicio părere publicată încă.",
		"reviews.admin.empty_rejected": "Nicio părere respinsă.",
		"reviews.admin.approve": "Publică",
		"reviews.admin.reject": "Respinge",
		"reviews.admin.delete": "Șterge",
		"reviews.admin.delete_confirm": "Ștergi definitiv această părere? Nu se mai poate recupera.",
		"reviews.admin.note":
			"Părerile vin de pe site-ul gratuit. Ce publici aici se vede acolo imediat, fără deploy; ce respingi rămâne doar pentru tine.",
		"atlas.plate": "Planșa",
		"atlas.chapter": "Tema",
		"practice.sheet": "Fișă de exersare",
		"practice.sheet.sub": "Test-grilă generat aleatoriu din întrebările clasei tale.",
		// Descrierea din <meta> pentru „Exersează" pe instanța LIBERĂ.
		//
		// `practice.sheet.sub` are 57 de caractere și, mai rău, spune „clasei tale" — formulare
		// din situl cu clase, unde elevul chiar intră cu un token al clasei lui. Pe situl liber
		// nu există „clasa ta": intră oricine. Numărul de întrebări se compune din bancul real,
		// deci descrierea nu poate promite mai mult decât există.
		"practice.seo.desc":
			"Teste grilă de geografie pentru {clasa}, generate pe loc din {n}. Corectate imediat, " +
			"gratuit, fără cont — și nu se salvează nimic.",
		"practice.seo.questions.one": "o întrebare",
		"practice.seo.questions.few": "{n} întrebări",
		"practice.seo.questions.many": "{n} de întrebări",
		"material.plate_of": "din",
		"demo.title": "Aruncă o privire",
		"demo.kicker": "Fără cont, fără cod — intră și vezi",
		"demo.lead":
			"Deschide o lecție întreagă, răsfoiește fotografiile, joacă-te cu harta și dă un test scurt. Exact ce primesc elevii.",
		"demo.students": "Elevi",
		"demo.students.desc": "Ce vede un elev după ce intră cu codul clasei.",
		"demo.teachers": "Profesori",
		"demo.teachers.desc": "Ce pregătești tu înainte de oră.",
		"demo.quiz.title": "Exersează",
		"demo.quiz.desc": "Șapte întrebări din toate temele, corectate pe loc.",
		"demo.quiz.start": "Începe testul",
		"demo.quiz.note": "{n} întrebări · fără cont, fără poreclă, nimic salvat.",
		"demo.open": "Deschide",
		"demo.grades.title": "Clase",
		"demo.grades.soon": "în pregătire",
		"demo.grades.count": "{n} materiale",
		"demo.locked.title": "Ai nevoie de un cont de profesor pentru a vedea restul",
		"demo.locked.more": "Încă {n} pagini în acest material",
		"demo.locked.cta": "Creează cont de profesor",
		"demo.cta.student": "Ai cod de clasă? Intră",
		"demo.cta.teacher": "Creează cont de profesor",
		"demo.back": "Înapoi la vitrină",
		"home.cta.token": "Intră cu codul clasei",
		"grade.notice.pending_curriculum":
			"Materialele vor fi încărcate odată cu intrarea în vigoare a noilor programe școlare.",
		// Titlul din <title> al paginii de start, DOAR pe instanța liberă (vezi `routes/home.tsx`).
		//
		// Titlul de dinainte era rezerva din `seo()`: „Geo-catedra — Geografia, toată într-un
		// singur loc." Sloganul e bun pe pagină, dar în rezultatele Google e singurul lucru pe
		// care îl vede cineva care n-a auzit de sit, iar acolo nu conține niciunul dintre
		// cuvintele după care se caută de fapt: „lecții", „jocuri", „teste", „gratuit".
		//
		// Ordinea e cuvinte-cheie întâi, marca la urmă — `seo()` adaugă singur ` — Geo-catedra`.
		// Iese la 58 de caractere, adică sub pragul la care Google taie titlul, deci partea cu
		// cuvintele-cheie se vede întreagă chiar și pe telefon.
		//
		// „gratuit" e adevărat aici și numai aici: pe instanța cu clase pagina de start rămâne
		// pe titlul dinainte, iar `home.tsx` alege între ele după `BUILD_SITE_MODE`.
		"home.seo.liber": "Lecții, jocuri și teste de geografie, gratuit",
		"liber.hero.title": "Geografie, pentru oricine",
		"liber.hero.lead": "Toate materialele, gratuit. Fără cont, fără cod, fără plată.",
		"liber.door.elevi": "Pentru elevi",
		"liber.door.elevi.desc": "Lecții, hărți, galerii foto și jocuri.",
		"liber.door.profesori": "Pentru profesori",
		"liber.door.profesori.desc":
			"Scheme de lecție, proiecte didactice, ghid metodologic – activități de învățare, studii de caz în orizontul local, teste sumative.",
		"liber.elevi.title": "Materiale pentru elevi",
		"liber.pedagogie.title": "Materiale pentru profesori",
		// Titlurile din <title>, separate de titlurile vizibile (H1). Nu e o dublare inutilă:
		// H1-ul stă sub antetul sitului, unde „geografie" e deja evident din context și ar suna
		// redundant; <title> apare în rezultatele Google SINGUR, fără niciun context, iar acolo
		// cuvântul „geografie" e chiar termenul după care se caută. Numele sitului îl adaugă
		// `seo()`, deci nu se scrie aici.
		// Titlul poartă CLASA, nu doar „elevi" (docs/09-seo-strategy.md, punctul 8).
		//
		// „materiale geografie clasa a 9-a" e un termen de nivel mediu-înalt al cărui SERP e
		// plin de PDF-uri scanate (Scribd, Academia.edu) — o bibliotecă adevărată îl bate pe
		// experiență. „Materiale de geografie pentru elevi" nu conținea cuvântul după care se
		// caută de fapt.
		//
		// E adevărat azi: singura clasă cu materie publicată e a 9-a; 10–12 apar pe pagină cu
		// mesajul programei noi. **Când intră conținutul de clasa a 10-a, șirul ăsta devine o
		// minciună pe jumătate** — atunci se construiesc paginile per clasă (`/elevi/:gradeId`),
		// ținta specifică se mută pe ele, iar aici rămâne termenul-umbrelă. Până atunci NU
		// construim `/elevi/9`: ar fi o copie aproape identică a acestei pagini, iar două adrese
		// care se bat pe aceeași căutare fac mai mult rău decât lipsa uneia dintre ele.
		"liber.elevi.seo": "Materiale de geografie pentru clasa a 9-a",
		"liber.pedagogie.seo": "Materiale de geografie pentru profesori",
		// Pagina care adună jocurile la un loc (/jocuri). Fiecare joc era, până acum, îngropat
		// într-un capitol — deci nicio pagină a sitului nu era DESPRE jocuri de geografie.
		"liber.jocuri.title": "Jocuri de geografie",
		"liber.jocuri.seo": "Jocuri de geografie interactive",
		"liber.jocuri.lead": "Învață jucându-te",
		// Enumerarea trebuie să corespundă cu ce e chiar în bază: `kind` din body-ul materialelor
		// de tip `joc` are ȘAPTE valori (asociere, ordonare, sortare, matrice, plaseaza-pe-harta,
		// harta-quiz, grila), nu patru. O listă incompletă în descrierea paginii e o promisiune
		// greșită și pentru cititor, și pentru motorul de căutare.
		"liber.jocuri.intro":
			"Toate jocurile interactive de pe site, la un loc: asociere, ordonare, sortare, matrice, " +
			"plasare pe hartă, hărți-quiz și teste grilă. Se joacă direct în browser, pe telefon sau " +
			"pe calculator — gratuit, fără cont.",
		"liber.jocuri.empty": "Încă nu e publicat niciun joc.",
		// Descrierea din <meta>, SEPARATĂ de introducerea de pe pagină.
		//
		// `liber.jocuri.intro` are 211 caractere: bună pe pagină, unde chiar enumeră cele șapte
		// motoare, dar Google taie fragmentul pe la ~160, deci în rezultate se termina la
		// „hărți-quiz și teste gr…" — adică exact cuvintele care conving se pierdeau. Aici
		// intră doar ce încape întreg.
		"liber.jocuri.meta":
			"Jocuri de geografie jucate direct în browser, pe telefon sau pe calculator: hărți, " +
			"asocieri, ordonări și teste grilă. Gratuit, fără cont.",
		// Trei forme, ca la planșe — vezi `formaPlural` din lib/plural.ts.
		"liber.jocuri.count.one": "{n} joc",
		"liber.jocuri.count.few": "{n} jocuri",
		"liber.jocuri.count.many": "{n} de jocuri",
		"liber.elevi.jocuri_cta": "Vezi toate jocurile de geografie",
		"liber.back.jocuri": "← Jocuri de geografie",
		"liber.hero.cta": "Intră la materiale",
		"liber.strip.title": "Din bibliotecă, chiar acum",
		"liber.door.elevi.cta": "Vezi materialele",
		"liber.door.profesori.cta": "Vezi rafturile",
		"liber.pedagogie.pages.one": "{n} planșă",
		"liber.pedagogie.pages.few": "{n} planșe",
		"liber.pedagogie.pages.many": "{n} de planșe",
		"liber.back.home": "← Acasă",
		"liber.back.elevi": "← Materiale pentru elevi",
		"liber.back.pedagogie": "← Materiale pentru profesori",
		"teacher.collection.open": "Deschide →",
		// Pagina nouă /intrebari-frecvente (doar instanța liberă) + linkul ei din subsol.
		"faq.title": "Întrebări frecvente",
		"footer.faq": "Întrebări frecvente",

		// ====================================================================
		// Firimituri de navigare (components/Breadcrumbs.tsx + lib/jsonld.ts).
		// Scurte pe cât se poate: firimitura e un drum, nu un titlu — „Elevi", nu
		// „Materiale pentru elevi", care ar rupe rândul pe telefon la a doua treaptă.
		// ====================================================================
		"crumb.home": "Acasă",
		"crumb.elevi": "Elevi",
		"crumb.jocuri": "Jocuri",
		"crumb.pedagogie": "Profesori",

		// ====================================================================
		// Pagina de material — structura de titluri.
		//
		// Un material de tip „teanc de pagini" e alcătuit din imagini: singurul text pe care
		// îl poate citi un motor de căutare e titlul, descrierea și ce scriem noi în jurul lui.
		// De aici cele două secțiuni: un rezumat în cuvinte și o punte spre testul grilă.
		// ====================================================================
		"material.about.title": "Despre ce e vorba",
		"material.browse.title": "Răsfoiește lecția",
		"material.practice.title": "Testează-te",
		"material.practice.text":
			"După ce citești lecția, verifică ce ai reținut cu un test grilă generat pe loc din întrebările capitolului.",
		"material.practice.cta": "Dă un test grilă",
		"material.related.title": "Alte materiale din acest capitol",
		"material.chapter_all": "Vezi tot capitolul",

		// ====================================================================
		// Rafturile de pedagogie — text de context și semnătură.
		//
		// Semnătura nu e decor: pe o pagină de resurse pentru profesori, „cine a pregătit
		// asta" e chiar întrebarea pe care și-o pune cititorul întâi. `{name}` și `{role}`
		// se înlocuiesc din `subjectConfig.author`, deci nu se pot scrie greșit aici.
		// ====================================================================
		"teacher.shelf.about.title": "Ce găsești aici",
		"teacher.shelf.signature": "Pregătit de {name}, {role}.",
		"teacher.shelf.related.title": "Alte materiale din acest raft",
		"teacher.shelf.pair.title": "Perechea din programă",
		"teacher.shelf.other_shelves": "Celelalte rafturi",
		// Descrierea din <meta> a unui raft. Descrierea din config („Scheme gata de folosit la
		// clasă.") are 32 de caractere — corectă pe pagină, unde stă lângă titlu și lângă listă,
		// dar prea subțire singură într-un rezultat de căutare, unde e tot ce vede omul. Se
		// compune cu numărul REAL de materiale și de planșe, deci nu poate rămâne în urmă.
		"teacher.shelf.seo.desc": "{desc} {n} pentru profesorii de geografie, gratuit și fără cont.",
		"teacher.shelf.seo.count.one": "un material",
		"teacher.shelf.seo.count.few": "{n} materiale",
		"teacher.shelf.seo.count.many": "{n} de materiale",
		"curriculum.note": "Materialele urmează programa școlară în vigoare pentru liceu.",

		// ====================================================================
		// „Despre autoare" — pagina de încredere a sitului (/despre).
		//
		// Nu e o pagină de marketing: e răspunsul la „cine a scris astea și de ce să am
		// încredere". Tot ce scrie aici trebuie să fie verificabil din chiar conținutul
		// sitului — vezi comentariul de la `author` de mai sus.
		// ====================================================================
		"about.title": "Despre autoare",
		"about.seo": "Despre autoarea materialelor",
		"about.kicker": "Cine a scris materialele de pe acest site",
		"about.meta_desc":
			"Materialele de pe Geo-catedra sunt scrise de o singură profesoară de geografie: lecții, jocuri, teste și o bibliotecă întreagă de pedagogie, oferite gratuit.",
		"about.credentials.title": "Repere",
		"about.work.title": "Ce am publicat aici",
		"about.contact.title": "Cum mă poți contacta",
		"about.contact.text":
			"Dacă găsești o greșeală într-o lecție sau vrei să-mi spui cum ți-au fost de folos materialele, scrie-mi. Citesc tot.",
		"about.nodownload.title": "De ce nu se pot descărca materialele",
		"about.nodownload.text":
			"Materialele se văd întregi, gratuit, oricând — dar nu se descarcă. Sunt ani de muncă la clasă puși pe hârtie, iar un fișier plecat de aici ajunge, în câteva zile, republicat fără nume pe zece alte site-uri. Le las deschise pentru citit și pentru folosit la oră; le țin pe site ca să rămână legate de omul care le-a scris.",
		"author.role": "profesoară de geografie",
		"author.bio.1":
			"Mă numesc Liliana Necula și predau geografie. Materialele de pe acest site sunt cele pe care le folosesc chiar eu la clasă — nu o colecție adunată de undeva, ci lecțiile, schemele, proiectele și testele pe care le-am scris pentru orele mele.",
		"author.bio.2":
			"Le-am pus aici pentru că un material bun nu se termină după ora la care l-ai folosit. Un elev care a lipsit, un părinte care vrea să înțeleagă ce se învață, un coleg la început de carieră care caută o schemă de lecție gata gândită — toți au nevoie de aceleași lucruri, iar un site le poate ține deschise tot anul.",
		"author.bio.3":
			"Fotografiile și hărțile de pe site sunt din domeniul public sau cu licență CC0, alese și verificate una câte una, ca materialele să poată fi folosite la clasă fără nicio grijă de drepturi de autor.",
		"author.cred.1":
			"Toată materia de clasa a 9-a publicată: lecții scrise, galerii foto, jocuri interactive și un banc de întrebări grilă pe fiecare capitol al programei.",
		"author.cred.2":
			"Cinci rafturi de materiale pentru profesori: scheme de lecție, ghid metodologic, proiecte de lecție, studii de caz și teste-model — perechi 1:1 pe temele programei.",
		"author.cred.3":
			"Studii de caz în orizontul local — Dobrogea — scrise pornind de la locurile pe care le pot arăta elevilor pe teren.",
		"footer.about": "Despre autoare",
	},
};

export type { SubjectConfig } from "./types";

export function gradeById(id: string) {
	return subjectConfig.grades.find((g) => g.id === id);
}

export function topicsForGrade(gradeId: string) {
	return subjectConfig.topics[gradeId] ?? [];
}

export function t(key: string): string {
	return subjectConfig.strings[key] ?? key;
}

export function topicLabelBySlug(slug: string | null): string {
	if (!slug) return t("practice.whole_grade");
	for (const list of Object.values(subjectConfig.topics)) {
		const found = list.find((tp) => tp.slug === slug);
		if (found) return found.label;
	}
	return slug;
}
