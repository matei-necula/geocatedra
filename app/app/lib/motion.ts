import { useCallback, useRef } from "react";
import { animate } from "motion/mini";
import { inView } from "motion";

type RevealDeps = {
	inView: (el: HTMLElement, onStart: () => void, options?: unknown) => () => void;
	animate: (el: HTMLElement, keyframes: Record<string, unknown>, options?: unknown) => unknown;
};

const deps: RevealDeps = {
	inView: (el, onStart, options) => inView(el, () => onStart(), options as never),
	animate: (el, keyframes, options) => animate(el, keyframes as never, options as never),
};

/**
 * Apariția la scroll: elementul intră o dată, când ajunge în ecran, și rămâne.
 *
 *     const reveal = useReveal();
 *     <section ref={reveal}> … </section>
 *
 * Trei reguli, toate cu motiv:
 *
 *  1. **O singură dată.** Elementele care reapar la fiecare scroll în sus obosesc și fac
 *     pagina să pară instabilă. `inView` întoarce o funcție de oprire, chemată după prima
 *     intrare.
 *  2. **`prefers-reduced-motion` iese ÎNAINTE de orice.** Nu „animăm mai puțin" — nu animăm
 *     deloc, iar elementul rămâne în starea finală. Aici e capcana: blocul global din
 *     `app.css` scurtează tranzițiile la zero, dar dacă starea de pornire ar fi `opacity: 0`,
 *     scurtarea ar lăsa conținutul INVIZIBIL pentru exact utilizatorii care au cerut mai
 *     puțină mișcare. O animație de apariție trebuie să se dezarmeze singură.
 *  3. **Pornim din starea finală.** Ascunderea se aplică din JavaScript, deci dacă scriptul
 *     nu rulează sau cade, conținutul e vizibil. Un sit care își ascunde conținutul până se
 *     încarcă un script e rupt pentru oricine are conexiune proastă — adică exact pentru
 *     elevii de pe telefon.
 */
export function createReveal(d: RevealDeps = deps) {
	/**
	 * Starea stă pe ELEMENT, nu pe hook.
	 *
	 * Aici era bugul: `useReveal()` se cheamă o dată, iar funcția-ref întoarsă se pune pe mai
	 * multe secțiuni (pagina de start liberă are trei). Cu un singur `stop`/`timer` ținut în
	 * închidere, montarea secțiunii următoare oprea observatorul celei dinainte ȘI îi anula
	 * plasa de siguranță — după ce aceea fusese deja trecută pe `opacity: 0`. Rămânea
	 * invizibilă pentru totdeauna. Pe laptop nu se vedea, fiindcă acolo ușile sunt deasupra
	 * liniei de plutire la montare, deci nici nu se ascund; pe telefon eroul le împinge sub
	 * ea, deci exact acolo dispăreau.
	 */
	const live = new Map<HTMLElement, () => void>();

	return (el: HTMLElement | null) => {
		// React 18 (și orice apelant care nu folosește funcția de curățare) desprinde ref-ul
		// chemându-l cu `null`, fără să spună despre CARE element e vorba: oprim tot.
		if (!el) {
			for (const opreste of live.values()) opreste();
			live.clear();
			return;
		}
		if (typeof window === "undefined") return;
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

		/**
		 * Ce e DEJA pe ecran nu se ascunde niciodată.
		 *
		 * O apariție la scroll are sens doar pentru ce vine de sub linia de plutire. Pentru ce
		 * se vede deja, ascunderea nu adaugă nimic și aduce singurul mod real de eșec: dacă
		 * ceva ține observatorul tăcut, conținutul rămâne invizibil.
		 *
		 * Și se întâmplă: nici `IntersectionObserver`, nici `setTimeout` nu rulează normal
		 * într-o filă de fundal, iar „deschide în filă nouă" e felul obișnuit în care oamenii
		 * deschid linkuri. Cu verificarea asta, o filă deschisă în fundal arată pagina
		 * întreagă din prima; efectul rămâne doar acolo unde chiar se vede.
		 */
		if (el.getBoundingClientRect().top < window.innerHeight) return;

		live.get(el)?.();

		el.style.opacity = "0";
		el.style.transform = "translateY(14px)";

		let stop: (() => void) | null = null;
		let timer: ReturnType<typeof setTimeout> | null = null;
		let gata = false;

		const curata = () => {
			if (timer) clearTimeout(timer);
			timer = null;
			stop?.();
			stop = null;
			live.delete(el);
		};

		const arata = () => {
			if (gata) return;
			gata = true;
			curata();
			d.animate(el, { opacity: 1, transform: "translateY(0px)" }, { duration: 0.5, ease: [0.22, 1, 0.36, 1] });
		};

		/**
		 * Plasă de siguranță: dacă observatorul n-a declanșat în 1,2 s, arătăm oricum.
		 *
		 * Nu e paranoia. `IntersectionObserver` NU declanșează într-o filă de fundal — iar
		 * „deschide în filă nouă" e felul normal în care oamenii deschid linkuri. Fără plasa
		 * asta, conținutul ar rămâne la `opacity: 0` până când utilizatorul se uită la filă;
		 * de obicei asta merge, dar orice altă cauză care ține observatorul tăcut ar ascunde
		 * definitiv jumătate din pagina de start. O animație de apariție care poate lăsa
		 * conținutul ascuns e mai rea decât lipsa animației.
		 */
		timer = setTimeout(arata, 1200);
		live.set(el, curata);

		stop = d.inView(el, () => arata(), { margin: "0px 0px -10% 0px", amount: 0.05 });
		// `inView` poate declanșa sincron (sau într-un test): dacă elementul s-a arătat deja,
		// observatorul întors acum n-ar mai fi oprit de nimeni.
		if (gata) {
			stop();
			stop = null;
		}

		// React 19 preferă funcția de curățare celei chemate cu `null` — și, spre deosebire
		// de aceea, ea ȘTIE despre ce element e vorba.
		return () => {
			live.get(el)?.();
		};
	};
}

export function useReveal() {
	const ref = useRef<ReturnType<typeof createReveal> | null>(null);
	if (!ref.current) ref.current = createReveal();
	return useCallback((el: HTMLElement | null) => ref.current?.(el), []);
}
