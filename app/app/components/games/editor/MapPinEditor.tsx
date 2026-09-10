import { useRef, useState } from "react";
import { ImagePicker, type ImgRef } from "./ImagePicker";

export type Pin = { id: string; x: number; y: number; label: string; img: ImgRef | null };

const inputCls =
	"rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "grid gap-1.5 text-sm";

interface Props {
	mode: "targets" | "points";
	map: ImgRef | null;
	pins: Pin[];
	onMapChange: (v: ImgRef | null) => void;
	onPinsChange: (p: Pin[]) => void;
	reusable: { assetId: string; title: string }[];
	/** „harta-quiz" only: how many points to quiz per playthrough (empty = all). */
	drawValue?: number;
	onDrawChange?: (v: number | undefined) => void;
}

/** Coordonate procentuale (0-100) ale unui punct față de un element,
 *  pe baza dreptunghiului lui curent — funcționează la orice dimensiune
 *  a imaginii, indiferent de rezoluția nativă. */
function pct(pt: { clientX: number; clientY: number }, el: HTMLElement) {
	const r = el.getBoundingClientRect();
	return {
		x: Math.min(100, Math.max(0, +(((pt.clientX - r.left) / r.width) * 100).toFixed(1))),
		y: Math.min(100, Math.max(0, +(((pt.clientY - r.top) / r.height) * 100).toFixed(1))),
	};
}

export function MapPinEditor({ mode, map, pins, onMapChange, onPinsChange, reusable, drawValue, onDrawChange }: Props) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);

	const selected = pins.find((p) => p.id === selectedId) ?? null;

	function addPinAt(pt: { clientX: number; clientY: number }) {
		const wrapper = wrapperRef.current;
		if (!wrapper) return;
		const { x, y } = pct(pt, wrapper);
		const pin: Pin = { id: crypto.randomUUID().slice(0, 8), x, y, label: "", img: null };
		onPinsChange([...pins, pin]);
		setSelectedId(pin.id);
	}

	function handleBackgroundClick(e: React.MouseEvent<HTMLDivElement>) {
		// Pins stop propagation on their own click, so this only fires for
		// clicks on the map background itself.
		addPinAt(e);
	}

	function updatePin(id: string, fn: (p: Pin) => Pin) {
		onPinsChange(pins.map((p) => (p.id === id ? fn(p) : p)));
	}

	function removePin(id: string) {
		onPinsChange(pins.filter((p) => p.id !== id));
		if (selectedId === id) setSelectedId(null);
	}

	function handlePinClick(e: React.MouseEvent, id: string) {
		e.stopPropagation();
		setSelectedId(id);
	}

	function handlePinPointerDown(e: React.PointerEvent<HTMLButtonElement>, id: string) {
		e.stopPropagation();
		if (e.button !== 0 && e.pointerType === "mouse") return;
		e.currentTarget.setPointerCapture(e.pointerId);
		setSelectedId(id);
		setDraggingId(id);
	}

	function handlePinPointerMove(e: React.PointerEvent<HTMLButtonElement>, id: string) {
		if (draggingId !== id) return;
		const wrapper = wrapperRef.current;
		if (!wrapper) return;
		const { x, y } = pct(e, wrapper);
		updatePin(id, (p) => ({ ...p, x, y }));
	}

	function endDrag(e: React.PointerEvent<HTMLButtonElement>, id: string) {
		if (draggingId === id) setDraggingId(null);
		if (e.currentTarget.hasPointerCapture(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId);
		}
	}

	return (
		<div className="grid gap-4">
			<ImagePicker value={map} onChange={onMapChange} reusable={reusable} label="Harta" />

			{!map ? (
				<p className="text-sm text-muted">Încarcă harta ca să adaugi puncte.</p>
			) : (
				<>
					<div
						ref={wrapperRef}
						onClick={handleBackgroundClick}
						className="relative cursor-crosshair select-none overflow-hidden rounded-xl border border-border"
					>
						<img src={map.previewUrl} alt="" className="block w-full" draggable={false} />
						{pins.map((pin, i) => (
							<button
								key={pin.id}
								type="button"
								aria-label={`Punctul ${i + 1}: ${pin.label || "fără nume"}`}
								onClick={(e) => handlePinClick(e, pin.id)}
								onPointerDown={(e) => handlePinPointerDown(e, pin.id)}
								onPointerMove={(e) => handlePinPointerMove(e, pin.id)}
								onPointerUp={(e) => endDrag(e, pin.id)}
								onPointerCancel={(e) => endDrag(e, pin.id)}
								className={`absolute grid h-11 w-11 touch-none place-items-center rounded-full border-2 text-xs font-semibold shadow-md ${
									draggingId === pin.id ? "" : "motion-safe:transition-[left,top] motion-safe:duration-150"
								} ${
									pin.id === selectedId
										? "border-primary bg-primary text-on-primary"
										: "border-border bg-surface text-ink hover:bg-bg-alt"
								}`}
								style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%,-50%)" }}
							>
								{i + 1}
							</button>
						))}
					</div>

					{onDrawChange && (
						<label className={labelCls}>
							<span className="text-muted">Câte puncte pe rundă (gol = toate)</span>
							<input
								type="number"
								min={2}
								inputMode="numeric"
								value={drawValue ?? ""}
								onChange={(e) => {
									const v = e.target.value.trim();
									if (v === "") return onDrawChange(undefined);
									const n = Number.parseInt(v, 10);
									onDrawChange(Number.isNaN(n) ? undefined : n);
								}}
								className={`${inputCls} w-32`}
							/>
						</label>
					)}

					{selected && (
						<div className="grid gap-3 rounded-lg border border-border p-3">
							<label className={labelCls}>
								<span className="text-muted">{mode === "targets" ? "Etichetă" : "Nume"}</span>
								<input
									value={selected.label}
									onChange={(e) => updatePin(selected.id, (p) => ({ ...p, label: e.target.value }))}
									className={inputCls}
								/>
							</label>
							{mode === "targets" && (
								<ImagePicker
									label="Imagine"
									value={selected.img}
									onChange={(v) => updatePin(selected.id, (p) => ({ ...p, img: v }))}
									reusable={reusable}
								/>
							)}
							<button
								type="button"
								onClick={() => removePin(selected.id)}
								className="justify-self-start rounded-lg border border-border px-3 py-1.5 text-sm text-accent-strong hover:bg-bg-alt"
							>
								Șterge punctul
							</button>
						</div>
					)}

					{pins.length > 0 && (
						<ul className="grid gap-1">
							{pins.map((pin, i) => (
								<li key={pin.id}>
									<button
										type="button"
										onClick={() => setSelectedId(pin.id)}
										className={`w-full rounded-lg border px-3 py-1.5 text-left text-sm ${
											pin.id === selectedId
												? "border-primary bg-primary/10 font-semibold text-primary"
												: "border-border hover:bg-bg-alt"
										}`}
									>
										{i + 1}. {pin.label || <span className="text-muted">(fără nume)</span>}
									</button>
								</li>
							))}
						</ul>
					)}
				</>
			)}
		</div>
	);
}
