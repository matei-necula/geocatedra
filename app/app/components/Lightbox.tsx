import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useWatermark, Watermark } from "./Watermark";

export interface LightboxImage {
	id: string;
	alt?: string;
}

/**
 * Vizualizor pe tot ecranul pentru o serie de imagini — folosit de galeriile
 * foto (`PhotoBlock`/`ImageGallery`/`Attachments` din acest fișier) și de
 * teancul de pagini (`PageBook`). E o suprapunere fixă (poziționare CSS, nu
 * API-ul Fullscreen al browserului) — mai fiabilă pe Safari de mobil, unde
 * elevii chiar sunt cel mai des. Capcană de focus, Escape închide, săgețile
 * stânga/dreapta navighează, iar la închidere focusul revine la elementul
 * care a deschis suprapunerea.
 *
 * NU introduce nicio cale de descărcare: fără link „deschide în filă nouă",
 * fără `<a download>`. Imaginea are `draggable={false}` și blochează meniul
 * contextual — la fel ca restul componentelor din acest fișier.
 *
 * Cadrul imaginii (`.cat-img-frame`) e același nume de clasă folosit și în
 * randarea inline (vezi PhotoBlock/ImageGallery/PageBook): un filigran de
 * sesiune adăugat acolo ca element absolut-poziționat în interiorul acestui
 * cadru apare automat și pe tot ecranul, fără nicio modificare aici.
 */
export function Lightbox({
	images,
	index,
	onIndexChange,
	onClose,
	renderCaption,
}: {
	images: LightboxImage[];
	index: number;
	onIndexChange: (i: number) => void;
	onClose: () => void;
	renderCaption?: (i: number) => ReactNode;
}) {
	const [visible, setVisible] = useState(false);
	const dialogRef = useRef<HTMLDivElement>(null);
	const closeBtnRef = useRef<HTMLButtonElement>(null);
	const captionId = useId();
	// Filigranul vine prin context — contextul React trece prin portal, CSS-ul nu.
	const wm = useWatermark();

	// Nu există niciun caz în care acest component se randează la SSR: toți
	// apelanții îl montează doar când `openIndex !== null`, iar starea aceea
	// pornește mereu `null` — deci `<Lightbox>` există în arbore doar după un
	// clic pe client, cu `document` deja disponibil. De aceea portalul de mai
	// jos poate folosi `document.body` direct, fără o gardă suplimentară de
	// "mounted" (care ar fi și greșită: la primul commit butonul de închidere
	// tot n-ar exista încă, deci focusul de mai jos ar rata elementul).

	// O bornă mică pentru tranziția de fade-in — respectă prefers-reduced-motion
	// prin variantele Tailwind `motion-safe:`, nu prin JS.
	useEffect(() => {
		const raf = requestAnimationFrame(() => setVisible(true));
		return () => cancelAnimationFrame(raf);
	}, []);

	// Focus intră în suprapunere la deschidere și se întoarce la elementul
	// care a declanșat-o (de regulă butonul/imaginea pe care s-a dat click),
	// la închidere.
	useEffect(() => {
		const trigger = document.activeElement as HTMLElement | null;
		closeBtnRef.current?.focus();
		return () => {
			trigger?.focus?.();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Blochează scrollul paginii din spate cât suprapunerea e deschisă —
	// altfel pe mobil rămâne "spatele" derulabil sub ea.
	useEffect(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, []);

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
				return;
			}
			if (e.key === "ArrowRight") {
				if (index < images.length - 1) {
					e.preventDefault();
					onIndexChange(index + 1);
				}
				return;
			}
			if (e.key === "ArrowLeft") {
				if (index > 0) {
					e.preventDefault();
					onIndexChange(index - 1);
				}
				return;
			}
			if (e.key === "Tab") {
				const root = dialogRef.current;
				if (!root) return;
				const focusables = Array.from(
					root.querySelectorAll<HTMLElement>(
						'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
					),
				);
				if (focusables.length === 0) return;
				const first = focusables[0];
				const last = focusables[focusables.length - 1];
				if (e.shiftKey && document.activeElement === first) {
					e.preventDefault();
					last.focus();
				} else if (!e.shiftKey && document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [index, images.length, onClose, onIndexChange]);

	const current = images[index];
	if (!current) return null;

	return createPortal(
		<div
			ref={dialogRef}
			role="dialog"
			aria-modal="true"
			aria-label="Imagine pe tot ecranul"
			aria-describedby={renderCaption || images.length > 1 ? captionId : undefined}
			onClick={onClose}
			className={`fixed inset-0 z-50 grid place-items-center bg-black/90 p-4 motion-safe:transition-opacity motion-safe:duration-200 ${
				visible ? "opacity-100" : "opacity-0"
			}`}
		>
			<button
				ref={closeBtnRef}
				type="button"
				onClick={onClose}
				aria-label="Închide imaginea pe tot ecranul"
				className="absolute top-3 right-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-xl text-white shadow-md backdrop-blur transition hover:bg-white/25"
			>
				✕
			</button>

			<div
				className="relative flex max-h-full max-w-full flex-col items-center gap-3"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="cat-img-frame relative grid max-h-[75vh] max-w-[92vw] place-items-center overflow-hidden rounded-lg">
					<img
						key={current.id}
						src={`/media/${current.id}`}
						alt={current.alt ?? ""}
						draggable={false}
						onContextMenu={(e) => e.preventDefault()}
						className="max-h-[75vh] max-w-[92vw] object-contain"
					/>

					{wm && <Watermark code={wm.code} />}

					{images.length > 1 && (
						<>
							<button
								type="button"
								onClick={() => index > 0 && onIndexChange(index - 1)}
								disabled={index === 0}
								aria-label="Imaginea anterioară"
								className="absolute top-1/2 left-2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-xl text-white shadow-md backdrop-blur transition hover:bg-white/25 disabled:opacity-30"
							>
								‹
							</button>
							<button
								type="button"
								onClick={() => index < images.length - 1 && onIndexChange(index + 1)}
								disabled={index === images.length - 1}
								aria-label="Imaginea următoare"
								className="absolute top-1/2 right-2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-xl text-white shadow-md backdrop-blur transition hover:bg-white/25 disabled:opacity-30"
							>
								›
							</button>
						</>
					)}
				</div>

				{(renderCaption || images.length > 1) && (
					<div id={captionId} className="max-w-[92vw] text-center text-sm text-white/85">
						{renderCaption?.(index)}
						{images.length > 1 && <span className="mt-1 block text-xs text-white/60">{index + 1} / {images.length}</span>}
					</div>
				)}
			</div>
		</div>,
		document.body,
	);
}

/** Micro-stare pentru „ce imagine e deschisă pe tot ecranul, dacă e vreuna". */
export function useLightbox() {
	const [openIndex, setOpenIndex] = useState<number | null>(null);
	return {
		openIndex,
		open: (i: number) => setOpenIndex(i),
		close: () => setOpenIndex(null),
		setIndex: (i: number) => setOpenIndex(i),
	};
}

/** Buton vizibil de extindere pe tot ecranul, suprapus peste o imagine. */
export function FullscreenButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
	return (
		<button
			type="button"
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			aria-label="Vezi imaginea pe tot ecranul"
			title="Vezi imaginea pe tot ecranul"
			className={`grid h-9 w-9 place-items-center rounded-full bg-black/45 text-white shadow-md backdrop-blur transition hover:bg-black/60 ${className}`}
		>
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
				<path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		</button>
	);
}
