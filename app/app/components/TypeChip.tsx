import { subjectConfig, t } from "../config/subject";

// Color-coded per material type, by its index in config (stays subject-agnostic —
// the engine assigns visuals by position, not by any hardcoded subject knowledge).
const COMBOS = [
	{ chip: "bg-sky-100 text-sky-700" },
	{ chip: "bg-primary/10 text-primary" },
	{ chip: "bg-emerald-100 text-emerald-700" },
	{ chip: "bg-accent/15 text-accent-strong" },
	{ chip: "bg-violet-100 text-violet-700" },
	{ chip: "bg-amber-100 text-amber-700" },
];

// Solid background classes (parallel to COMBOS, same order) for card index tabs.
const TABS = ["bg-sky-500", "bg-primary", "bg-emerald-500", "bg-accent", "bg-violet-500", "bg-amber-500"];

export function typeMeta(type: string): { icon: string; label: string; chip: string; tab: string } {
	const idx = subjectConfig.materialTypes.findIndex((m) => m.key === type);
	const def = idx >= 0 ? subjectConfig.materialTypes[idx] : undefined;
	const safe = idx < 0 ? 0 : idx;
	return {
		icon: def?.icon ?? "•",
		label: t(`type.${type}`),
		chip: COMBOS[safe % COMBOS.length].chip,
		tab: TABS[safe % TABS.length],
	};
}

export function typeColor(type: string): string {
	return typeMeta(type).tab;
}

export function TypeChip({ type }: { type: string }) {
	const m = typeMeta(type);
	return (
		<span className={`inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${m.chip}`}>
			<span aria-hidden>{m.icon}</span>
			{m.label}
		</span>
	);
}

export function TypeIcon({ type }: { type: string }) {
	const m = typeMeta(type);
	return (
		<span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md text-base ${m.chip}`} aria-hidden>
			{m.icon}
		</span>
	);
}
