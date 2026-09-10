import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { t } from "../config/subject";
import type { MindNode } from "../config/types";

// Generic, subject-agnostic palette cycled by branch index (theme-aware).
// Not tied to material types — this is a concept map, not a material list.
const BRANCH_COLORS = [
	"bg-primary/10 text-primary",
	"bg-accent/15 text-accent-strong",
	"bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
	"bg-violet-500/10 text-violet-700 dark:text-violet-300",
	"bg-amber-500/15 text-amber-700 dark:text-amber-300",
	"bg-sky-500/10 text-sky-700 dark:text-sky-300",
];

export function TopicMindMap({
	node,
	lessonHref,
}: {
	node: MindNode;
	lessonHref?: string;
}) {
	const branches = node.children ?? [];
	// Start collapsed: show only the main nodes; the user clicks to expand.
	const [open, setOpen] = useState<Record<number, boolean>>({});
	const wrapRef = useRef<HTMLDivElement>(null);
	const rootRef = useRef<HTMLSpanElement>(null);
	const branchRefs = useRef<Map<number, HTMLElement>>(new Map());
	const leafRefs = useRef<Map<string, HTMLElement>>(new Map());
	const [lines, setLines] = useState<{ d: string; leaf?: boolean }[]>([]);

	// Draw curved SVG connectors between nodes (root → branch, and branch → each of
	// its leaves when expanded), measured from the DOM so they reflow on resize and
	// on expand/collapse. Desktop only — on mobile the leaves stack under the branch.
	const measure = useCallback(() => {
		const wrap = wrapRef.current;
		const root = rootRef.current;
		if (!wrap || !root) return;
		const wb = wrap.getBoundingClientRect();
		const curve = (a: DOMRect, b: DOMRect) => {
			const x1 = a.right - wb.left;
			const y1 = a.top + a.height / 2 - wb.top;
			const x2 = b.left - wb.left;
			const y2 = b.top + b.height / 2 - wb.top;
			const mx = (x1 + x2) / 2;
			return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
		};
		const rb = root.getBoundingClientRect();
		const next: { d: string; leaf?: boolean }[] = [];
		for (let i = 0; i < branches.length; i++) {
			const bel = branchRefs.current.get(i);
			if (!bel) continue;
			const bb = bel.getBoundingClientRect();
			next.push({ d: curve(rb, bb) });
			if (!open[i]) continue;
			const leaves = branches[i].children ?? [];
			for (let j = 0; j < leaves.length; j++) {
				const lel = leafRefs.current.get(`${i}:${j}`);
				if (!lel) continue;
				next.push({ d: curve(bb, lel.getBoundingClientRect()), leaf: true });
			}
		}
		// Only update when geometry actually changed, so measuring can't loop.
		setLines((prev) =>
			prev.length === next.length && prev.every((p, i) => p.d === next[i].d && p.leaf === next[i].leaf)
				? prev
				: next,
		);
	}, [branches, open]);

	useLayoutEffect(() => {
		measure();
		const ro = new ResizeObserver(measure);
		if (wrapRef.current) ro.observe(wrapRef.current);
		window.addEventListener("resize", measure);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, [measure]);

	if (branches.length === 0) return null;

	return (
		<div>
			<div
				ref={wrapRef}
				className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-12"
			>
				<svg
					aria-hidden
					className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
					style={{ overflow: "visible" }}
				>
					{lines.map((l, i) => (
						<path
							key={i}
							d={l.d}
							fill="none"
							stroke="var(--color-primary)"
							strokeOpacity={l.leaf ? 0.22 : 0.35}
							strokeWidth={l.leaf ? 1 : 1.5}
						/>
					))}
				</svg>

				<div className="relative z-10 shrink-0">
					<span
						ref={rootRef}
						className="inline-block rounded-xl bg-primary px-4 py-2.5 font-heading text-base font-semibold text-on-primary shadow-sm"
						aria-label={`${t("mindmap.root_aria")} ${node.label}`}
					>
						{node.label}
					</span>
				</div>

				<ul className="relative z-10 grid gap-4 sm:gap-7">
					{branches.map((branch, i) => {
						const isOpen = open[i];
						const leaves = branch.children ?? [];
						const setBranchRef = (el: HTMLElement | null) => {
							if (el) branchRefs.current.set(i, el);
							else branchRefs.current.delete(i);
						};
						const color = BRANCH_COLORS[i % BRANCH_COLORS.length];
						return (
							// Desktop: branch and its leaves sit in a row (leaves fan out to the
							// right). Mobile: they stack (leaves indented under the branch).
							<li key={i} className="sm:flex sm:items-center sm:gap-8">
								<button
									ref={setBranchRef as React.Ref<HTMLButtonElement>}
									type="button"
									aria-expanded={isOpen}
									onClick={() => setOpen((s) => ({ ...s, [i]: !s[i] }))}
									className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-left text-sm font-semibold ${color}`}
								>
									{branch.label}
									{leaves.length > 0 && (
										<span aria-hidden className="ml-0.5 text-[10px]">
											{isOpen ? "▾" : "▸"}
										</span>
									)}
								</button>
								{isOpen && leaves.length > 0 && (
									<ul
										className="mt-2 mb-1 ml-2 grid gap-2.5 border-l-2 border-border/70 pl-4 sm:mt-0 sm:mb-0 sm:ml-0 sm:max-w-[18rem] sm:gap-3.5 sm:border-l-0 sm:pl-0"
										aria-label={`${branch.label} — ${t("mindmap.branch_aria")}`}
									>
										{leaves.map((leaf, j) => {
											const setLeafRef = (el: HTMLElement | null) => {
												if (el) leafRefs.current.set(`${i}:${j}`, el);
												else leafRefs.current.delete(`${i}:${j}`);
											};
											return (
												<li
													key={j}
													ref={setLeafRef}
													className="text-sm leading-relaxed text-ink sm:w-fit"
												>
													{leaf.label}
												</li>
											);
										})}
									</ul>
								)}
							</li>
						);
					})}
				</ul>
			</div>

			{lessonHref && (
				<Link
					to={lessonHref}
					viewTransition
					className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
				>
					{t("mindmap.open_lesson")}
					<span aria-hidden>→</span>
				</Link>
			)}
		</div>
	);
}
