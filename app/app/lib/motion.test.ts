import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createReveal } from "./motion";

/**
 * Regresie: pagina de start liberă cheamă `useReveal()` O SINGURĂ dată și pune aceeași
 * funcție-ref pe TREI secțiuni. Dacă starea (observatorul + plasa de siguranță) e ținută
 * pe hook, nu pe element, fiecare secțiune nouă o dezarmează pe cea dinainte — care tocmai
 * fusese trecută pe `opacity: 0`. Pe laptop nu se vedea: acolo ușile sunt deasupra liniei
 * de plutire la montare, deci nici nu se ascund. Pe telefon rămâneau invizibile pentru
 * totdeauna.
 */

type FakeEl = HTMLElement & { style: { opacity: string; transform: string } };

function fakeEl(top: number): FakeEl {
	return {
		style: { opacity: "", transform: "" },
		getBoundingClientRect: () => ({ top }) as DOMRect,
	} as unknown as FakeEl;
}

function harness() {
	const shown: FakeEl[] = [];
	const observers = new Map<FakeEl, () => void>();
	const stopped: FakeEl[] = [];
	const reveal = createReveal({
		animate: (el) => shown.push(el as FakeEl),
		inView: (el, onStart) => {
			observers.set(el as FakeEl, onStart);
			return () => {
				observers.delete(el as FakeEl);
				stopped.push(el as FakeEl);
			};
		},
	});
	return { reveal, shown, observers, stopped };
}

beforeEach(() => {
	vi.useFakeTimers();
	(globalThis as { window?: unknown }).window = {
		innerHeight: 800,
		matchMedia: () => ({ matches: false }),
	};
});

afterEach(() => {
	vi.useRealTimers();
	delete (globalThis as { window?: unknown }).window;
});

describe("createReveal", () => {
	it("nu ascunde ce e deja pe ecran", () => {
		const { reveal, observers } = harness();
		const el = fakeEl(100);
		reveal(el);
		expect(el.style.opacity).toBe("");
		expect(observers.size).toBe(0);
	});

	it("nu ascunde nimic când s-a cerut mai puțină mișcare", () => {
		(globalThis as unknown as { window: { matchMedia: () => { matches: boolean } } }).window.matchMedia =
			() => ({ matches: true });
		const { reveal } = harness();
		const el = fakeEl(2000);
		reveal(el);
		expect(el.style.opacity).toBe("");
	});

	it("arată elementul când observatorul declanșează", () => {
		const { reveal, shown, observers } = harness();
		const el = fakeEl(2000);
		reveal(el);
		expect(el.style.opacity).toBe("0");
		observers.get(el)!();
		expect(shown).toEqual([el]);
	});

	it("PLASA: fiecare element ascuns are propriul observator, chiar dacă ref-ul e comun", () => {
		const { reveal, observers } = harness();
		const primul = fakeEl(2000);
		const alDoilea = fakeEl(3000);
		reveal(primul);
		reveal(alDoilea);
		expect(primul.style.opacity).toBe("0");
		expect(observers.has(primul)).toBe(true);
		expect(observers.has(alDoilea)).toBe(true);
	});

	it("PLASA: al doilea element nu anulează cronometrul primului", () => {
		const { reveal, shown } = harness();
		const primul = fakeEl(2000);
		const alDoilea = fakeEl(3000);
		reveal(primul);
		reveal(alDoilea);
		vi.advanceTimersByTime(1200);
		expect(shown).toContain(primul);
		expect(shown).toContain(alDoilea);
	});

	it("desprinderea oprește observatorul elementului", () => {
		const { reveal, observers, stopped } = harness();
		const el = fakeEl(2000);
		const cleanup = reveal(el);
		cleanup?.();
		expect(observers.size).toBe(0);
		expect(stopped).toEqual([el]);
	});
});
