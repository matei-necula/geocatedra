import { useRef, useState } from "react";

export type DragState = { id: string; x0: number; y0: number; dx: number; dy: number };

/** Tragere cu Pointer Events (mouse + deget). Elementul tras primește
 *  `touch-none` și, în timpul tragerii, `pointer-events: none`, ca
 *  `document.elementFromPoint` să vadă ținta de sub el la drop. */
export function useDrag(onDrop: (id: string, clientX: number, clientY: number) => void) {
	const [drag, setDrag] = useState<DragState | null>(null);
	const live = useRef<DragState | null>(null);

	function start(e: React.PointerEvent, id: string) {
		if (e.button !== 0 && e.pointerType === "mouse") return;
		e.preventDefault();
		const st = { id, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 };
		live.current = st;
		setDrag(st);
		const move = (ev: PointerEvent) => {
			const s = live.current;
			if (!s) return;
			const n = { ...s, dx: ev.clientX - s.x0, dy: ev.clientY - s.y0 };
			live.current = n;
			setDrag(n);
		};
		const up = (ev: PointerEvent) => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			window.removeEventListener("pointercancel", up);
			const s = live.current;
			live.current = null;
			setDrag(null);
			if (s && ev.type === "pointerup") onDrop(s.id, ev.clientX, ev.clientY);
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
		window.addEventListener("pointercancel", up);
	}

	return { drag, start };
}

/** Stilul aplicat elementului aflat în tragere. */
export function dragStyle(drag: DragState | null, id: string): React.CSSProperties | undefined {
	if (drag?.id !== id) return undefined;
	return {
		transform: `translate(${drag.dx}px, ${drag.dy}px) scale(1.05)`,
		zIndex: 30,
		pointerEvents: "none",
		position: "relative",
	};
}
