import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Găzduiește o aplicație HTML de sine stătătoare (simulator, escape room)
 * într-un iframe **izolat**.
 *
 * `sandbox="allow-scripts"` fără `allow-same-origin` e miezul securității:
 * aplicația rulează, dar primește o origine opacă, deci nu poate citi cookie-ul
 * de sesiune, nu poate face cereri în numele elevului și nu poate atinge restul
 * paginii. E cod care nu vine de la noi — îl ținem în carantină.
 *
 * Ecranul complet are două forme, fiindcă pe iPhone browserul nu dă ecran
 * complet decât pentru video: încercăm întâi ecranul complet adevărat, iar dacă
 * browserul îl refuză, întindem noi rama peste toată pagina. Butonul de ieșire
 * stă **înăuntrul** ramei, ca să fie la îndemână în ambele cazuri — pe telefon
 * nu există tasta Esc.
 */
export function InteractiveApp({ html, title }: { html: string; title: string }) {
	const [nativ, setNativ] = useState(false);
	const [propriu, setPropriu] = useState(false);
	const cadru = useRef<HTMLDivElement>(null);
	const peTotEcranul = nativ || propriu;

	const iesi = useCallback(() => {
		if (document.fullscreenElement) void document.exitFullscreen();
		setPropriu(false);
	}, []);

	const comuta = useCallback(async () => {
		if (peTotEcranul) {
			iesi();
			return;
		}
		const el = cadru.current;
		if (!el) return;
		try {
			if (el.requestFullscreen) {
				await el.requestFullscreen();
				return;
			}
		} catch {
			// Browserul l-a refuzat (tipic pe iPhone) — cădem pe ecranul nostru.
		}
		setPropriu(true);
	}, [peTotEcranul, iesi]);

	useEffect(() => {
		function onChange() {
			setNativ(document.fullscreenElement === cadru.current);
		}
		document.addEventListener("fullscreenchange", onChange);
		return () => document.removeEventListener("fullscreenchange", onChange);
	}, []);

	// Cât ține ecranul nostru, pagina de dedesubt nu trebuie să se miște, iar
	// Esc trebuie să iasă — pe ecranul complet adevărat le face browserul.
	useEffect(() => {
		if (!propriu) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setPropriu(false);
		}
		const anterior = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		document.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = anterior;
			document.removeEventListener("keydown", onKey);
		};
	}, [propriu]);

	if (!html.trim()) {
		return (
			<p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">
				Aplicația nu are încă niciun conținut.
			</p>
		);
	}

	const rama = (
		<div
			ref={cadru}
			// `fixed` și `relative` sunt amândouă utilitare de poziționare: dacă
			// le punem pe amândouă, câștigă cea scrisă mai târziu în CSS, nu în
			// atributul class — de aceea alegem una singură.
			className={`overflow-hidden border-border bg-surface ${
				propriu ? "fixed inset-0 z-50" : "relative"
			} ${peTotEcranul ? "h-full rounded-none border-0" : "rounded-xl border"}`}
		>
			<iframe
				srcDoc={html}
				sandbox="allow-scripts"
				title={title}
				loading="lazy"
				className={`w-full border-0 ${
					peTotEcranul ? "h-full" : "h-[min(calc(100vh-12rem),44rem)] min-h-[20rem]"
				}`}
			/>
			{peTotEcranul && (
				<button
					type="button"
					onClick={iesi}
					aria-label="Ieși din ecran complet"
					title="Ieși din ecran complet"
					className="absolute bottom-3 right-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-border bg-surface/90 text-base text-primary shadow-md backdrop-blur transition hover:border-primary"
				>
					⤡
				</button>
			)}
		</div>
	);

	return (
		<div className="grid gap-3">
			{/* Pagina are un strat animat cu `transform`, iar un `position: fixed`
			    dinăuntrul lui s-ar raporta la acel strat, nu la ecran. De aceea
			    ecranul nostru complet se mută pe `body`, printr-un portal. */}
			{propriu ? createPortal(rama, document.body) : rama}
			{!peTotEcranul && (
				<div className="flex items-center justify-center gap-3">
					<button
						type="button"
						onClick={comuta}
						aria-label="Ecran complet"
						className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface text-base text-primary shadow-sm transition hover:border-primary"
					>
						⛶
					</button>
					<span className="text-sm text-muted">Aplicația rulează izolat. Pe ecran complet se vede cel mai bine.</span>
				</div>
			)}
		</div>
	);
}
