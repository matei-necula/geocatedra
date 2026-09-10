import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useWatermark, Watermark } from "./Watermark";
import type { AssetLite } from "./Attachments";
import { clampPage, pageForBook, type PageLink } from "../lib/pagebook";
import { t } from "../config/subject";

/**
 * Textul alternativ al unei planșe.
 *
 * Pe materialele de pedagogie teancul e TOT conținutul: lecția e o imagine, nu text. Deci
 * `alt`-ul e singurul lucru pe care îl aude un cititor de ecran și singurul pe care îl citește
 * un motor de căutare despre planșa aceea. „Pagina 3 din 12", cât scria înainte, spune doar unde
 * ești — nu și ce se vede, iar la 12 planșe identice ca text pagina n-avea niciun conținut
 * indexabil în afara titlului.
 *
 * Ce NU putem face: să descriem chiar desenul de pe planșă. Textul lui stă în `.pptx`-ul sursă,
 * nu în baza de date — o descriere inventată per pagină ar fi mai rea decât una generică. Deci
 * legăm planșa de materialul din care face parte, singurul adevăr pe care îl avem la îndemână:
 * „Tipologia rocilor — pagina 3 din 12". Ziua în care paginile își primesc propriul text din
 * ingest, aici se schimbă o singură funcție.
 */
function altPagina(title: string | undefined, page: number, total: number): string {
	const pozitie = `pagina ${page} din ${total}`;
	return title ? `${title} — ${pozitie}` : `Pagina ${page} din ${total}`;
}

/**
 * Răsfoire ca într-o carte: o singură pagină pe ecran, înainte/înapoi din săgeți
 * sau din tastele stânga/dreapta. Nu oferă descărcare — paginile sunt imagini
 * servite prin /media/:id, care are propriul control de acces pe server.
 */
export function PageBook({
	assets,
	count,
	links,
	locked,
	title,
}: {
	assets: AssetLite[];
	count: number;
	/** Zone de clic pe anumite pagini, spre alt material din aceeași colecție. */
	links?: PageLink[];
	/** Titlul materialului curent. Are două treburi: pleacă mai departe prin zonele de clic,
	 *  ca materialul-țintă să poată arăta drumul înapoi, ȘI intră în textul alternativ al
	 *  fiecărei pagini (vezi `altPagina`). Rămâne opțional: `demo.m.$gradeId.$slug.tsx`
	 *  randează teancul direct, fără titlu, iar acolo textul alternativ cade pe forma scurtă. */
	title?: string;
	/** Vitrina: se văd doar `assets`, dar teancul are `total` pagini. Ultima poziție e zidul. */
	locked?: { total: number };
}) {
	const pages = useMemo(
		() =>
			[...assets]
				.filter((a) => a.role === "image")
				.sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0))
				.slice(0, count),
		[assets, count],
	);
	const visible = pages.length;
	// Paginile din teanc (11), nu cele primite (6) — numărătoarea trebuie să spună adevărul.
	const totalPages = locked ? Math.max(locked.total, visible) : visible;
	// Zidul ocupă o poziție în plus, după ultima pagină permisă.
	const slots = visible + (locked ? 1 : 0);
	const [pagina, setPage] = useState(0);
	// La o zonă de clic, React Router schimbă materialul fără să demonteze teancul:
	// componenta rămâne pe loc, deci și numărul paginii. Dacă materialul următor are
	// mai puține pagini (suportul de lectură are 2, studiul de caz are 10), `pages[8]`
	// e `undefined` și randarea crapă — pagina „nu se deschidea”. Ținem minte de la ce
	// teanc vine indicele și îl ducem înapoi la prima pagină când teancul se schimbă.
	const cheie = pages[0]?.id ?? "";
	const [teanc, setTeanc] = useState(cheie);
	if (teanc !== cheie) {
		setTeanc(cheie);
		setPage(0);
	}
	const page = pageForBook(pagina, slots, teanc === cheie);
	const [peTotEcranul, setPeTotEcranul] = useState(false);
	const cadru = useRef<HTMLDivElement>(null);
	// Ținta unei zone de clic e un material FRATE: aceeași rută, alt slug. Așa
	// funcționează la fel pe /profesor/..., pe /pedagogie/... și la elevi, fără
	// ca teancul să știe pe ce instanță e.
	const { pathname, state } = useLocation();
	const fratePath = useCallback(
		(slug: string) => pathname.replace(/[^/]+$/, encodeURIComponent(slug)),
		[pathname],
	);
	// Materialul deschis dintr-o zonă de clic nu are cum să știe singur de unde a
	// venit: firul de pesmet duce la raft, nu înapoi la materialul-părinte. Originea
	// călătorește în starea rutei, deci întoarcerea apare fără să atingem conținutul.
	const venitDe = state as { from?: string; fromTitle?: string } | null;
	const inapoi = venitDe?.from && venitDe.from !== pathname ? venitDe : null;

	// Filigranul de pagină e un frate al acestui cadru, deci dispare când cadrul
	// intră pe tot ecranul. Atunci — și numai atunci — îl punem noi înăuntru,
	// ca să nu se suprapună două filigrane în vizualizarea normală.
	const wm = useWatermark();

	// Ecran complet: cea mai mare literă posibilă, pentru citit sau proiectat la clasă.
	const comutaEcranul = useCallback(() => {
		const el = cadru.current;
		if (!el) return;
		if (document.fullscreenElement) void document.exitFullscreen();
		else void el.requestFullscreen?.();
	}, []);

	useEffect(() => {
		function onChange() {
			setPeTotEcranul(document.fullscreenElement === cadru.current);
		}
		document.addEventListener("fullscreenchange", onChange);
		return () => document.removeEventListener("fullscreenchange", onChange);
	}, []);

	const move = useCallback((delta: number) => setPage((cur) => clampPage(cur + delta, slots)), [slots]);

	// Preîncărcăm pagina următoare: un <img> cu display:none nu e garantat descărcat.
	useEffect(() => {
		const next = pages[page + 1];
		if (!next) return;
		const img = new Image();
		img.src = `/media/${next.id}`;
	}, [pages, page]);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			// Nu furăm săgețile dintr-un câmp de text.
			const el = e.target as HTMLElement | null;
			if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
			if (e.key === "ArrowRight") {
				e.preventDefault();
				move(1);
			} else if (e.key === "ArrowLeft") {
				e.preventDefault();
				move(-1);
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [move]);

	if (visible === 0) {
		return (
			<p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">
				Materialul nu are încă pagini încărcate.
			</p>
		);
	}

	const isWall = locked != null && page === visible;
	const first = page === 0;
	const last = page === slots - 1;
	const btnBase =
		"grid h-11 w-11 place-items-center rounded-full border border-border text-xl text-primary shadow-sm transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border";
	const btn = `${btnBase} bg-surface`;
	const btnOverlay = `${btnBase} bg-surface/90 backdrop-blur absolute top-1/2 -translate-y-1/2`;

	return (
		<div className="grid gap-3">
			{inapoi && (
				<Link
					to={inapoi.from as string}
					className="justify-self-start rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-primary transition hover:border-primary hover:bg-primary/5"
				>
					← Înapoi la {inapoi.fromTitle ?? "materialul precedent"}
				</Link>
			)}
			<div
				ref={cadru}
				className={`relative grid place-items-center overflow-hidden border border-border bg-surface shadow-sm ${
					peTotEcranul ? "h-full rounded-none" : "rounded-xl"
				}`}
			>
				{isWall ? (
					<div className="grid max-w-md gap-4 p-8 text-center sm:p-12">
						<span aria-hidden className="text-4xl">🔒</span>
						<h2 className="font-heading text-2xl font-bold">{t("demo.locked.title")}</h2>
						<p className="text-muted">
							{t("demo.locked.more").replace("{n}", String(totalPages - visible))}
						</p>
						<a
							href="/profesor/inregistrare"
							className="mx-auto rounded-lg bg-accent px-5 py-2.5 font-semibold text-on-accent transition hover:bg-accent-strong"
						>
							{t("demo.locked.cta")}
						</a>
					</div>
				) : (
					// `relative` pe un container strâns pe imagine: zonele de clic se
					// așază în procente din PAGINĂ, nu din cadru — imaginea e centrată
					// și nu umple cadrul.
					<div className="relative">
						<img
							key={page}
							src={`/media/${pages[page].id}`}
							alt={altPagina(title, page + 1, totalPages)}
							// Pagina crește cât o lasă ecranul, dar rămâne întreagă: altfel, pe un laptop,
							// săgețile de sub ea ar cădea sub marginea de jos.
							className={`cat-page mx-auto ${peTotEcranul ? "max-h-full w-auto max-w-full" : "max-h-[calc(100vh-21rem)] w-auto max-w-full"}`}
							draggable={false}
						/>
						{(links ?? [])
							.filter((l) => l.page === page + 1)
							.map((l) => (
								<Link
									key={`${l.slug}-${l.x}-${l.y}`}
									to={fratePath(l.slug)}
									state={{ from: pathname, fromTitle: title }}
									aria-label={l.label ?? "Deschide materialul legat"}
									title={l.label ?? "Deschide materialul legat"}
									// Zona se vede și fără mouse: pe telefon nu există hover, iar o zonă
									// cu totul invizibilă pe o pagină-imagine nu are cum să fie ghicită.
									className="absolute rounded-sm bg-primary/[0.08] ring-1 ring-primary/30 transition hover:bg-primary/15 hover:ring-2 hover:ring-primary/60 focus-visible:ring-2 focus-visible:ring-primary"
									style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%`, height: `${l.h}%` }}
								/>
							))}
					</div>
				)}

				{wm && peTotEcranul && <Watermark code={wm.code} />}

				<button
					type="button"
					onClick={() => move(-1)}
					disabled={first}
					aria-label="Pagina anterioară"
					className={`${btnOverlay} left-2`}
				>
					‹
				</button>
				<button
					type="button"
					onClick={() => move(1)}
					disabled={last}
					aria-label="Pagina următoare"
					className={`${btnOverlay} right-2`}
				>
					›
				</button>
			</div>

			<div className="flex items-center justify-center gap-4">
				<button type="button" onClick={() => move(-1)} disabled={first} aria-label="Pagina anterioară" className={btn}>
					‹
				</button>
				<span aria-live="polite" className="min-w-24 text-center text-sm font-medium text-muted">
					{isWall
						? t("demo.locked.more").replace("{n}", String(totalPages - visible))
						: `Pagina ${page + 1} din ${totalPages}`}
				</span>
				<button type="button" onClick={() => move(1)} disabled={last} aria-label="Pagina următoare" className={btn}>
					›
				</button>
				<button
					type="button"
					onClick={comutaEcranul}
					aria-label={peTotEcranul ? "Ieși din ecran complet" : "Ecran complet"}
					title={peTotEcranul ? "Ieși din ecran complet" : "Ecran complet"}
					className={`${btn} text-base`}
				>
					{peTotEcranul ? "⤡" : "⛶"}
				</button>
			</div>
		</div>
	);
}
