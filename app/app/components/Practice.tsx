import { Link, useFetcher, useSubmit } from "react-router";
import { useEffect, useState } from "react";
import { t } from "../config/subject";
import { Plate } from "./atlas";

export interface ReviewItem {
	stem: string;
	options: string[];
	chosen: number;
	correctIndex: number;
	explanation: string;
	ok: boolean;
}

export function PracticeTest({ questions, signed }: { questions: { id: string; stem: string; options: string[] }[]; signed: string }) {
	const fetcher = useFetcher<{ phase?: string; correct?: boolean; hint?: string; explanation?: string; signed?: string }>();
	const submit = useSubmit();
	const [index, setIndex] = useState(0);
	const [token, setToken] = useState(signed);
	const [chosen, setChosen] = useState<number | null>(null);
	const [status, setStatus] = useState<"answering" | "correct" | "wrong">("answering");
	const [hint, setHint] = useState<string | null>(null);
	const [explanation, setExplanation] = useState<string | null>(null);

	const total = questions.length;
	const q = questions[index];
	const pending = fetcher.state !== "idle";
	const locked = pending || status === "correct";
	const isLast = index + 1 >= total;

	function pick(oi: number) {
		if (locked) return;
		setChosen(oi);
		const fd = new FormData();
		fd.set("intent", "check");
		fd.set("signed", token);
		fd.set("questionId", q.id);
		fd.set("chosen", String(oi));
		fetcher.submit(fd, { method: "post" });
	}

	useEffect(() => {
		if (fetcher.state !== "idle" || !fetcher.data) return;
		const d = fetcher.data;
		if (d.phase === "expired") {
			setStatus("wrong");
			setHint("Testul a expirat. Reîncarcă pagina ca să începi din nou.");
			return;
		}
		if (d.phase !== "checked" || !d.signed) return;
		setToken(d.signed);
		if (d.correct) {
			setStatus("correct");
			setExplanation(d.explanation ?? "");
			setHint(null);
		} else {
			setStatus("wrong");
			setHint(d.hint ?? "");
			setExplanation(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.state, fetcher.data]);

	function goNext() {
		if (status !== "correct") return;
		if (isLast) {
			const fd = new FormData();
			fd.set("intent", "submit");
			fd.set("signed", token);
			submit(fd, { method: "post" });
			return;
		}
		setIndex((i) => i + 1);
		setStatus("answering");
		setChosen(null);
		setHint(null);
		setExplanation(null);
	}

	const pct = Math.round((index / total) * 100);

	return (
		<div className="cat-rise grid gap-5">
			<noscript>
				<p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-strong">{t("practice.js_required")}</p>
			</noscript>

			<div>
				<div className="mb-1 flex items-center justify-between text-xs text-muted">
					<span className="tabular-nums">{t("practice.question")} {index + 1}/{total}</span>
				</div>
				<div className="relative h-5">
					<div aria-hidden className="absolute inset-x-0 top-1/2 border-t-2 border-dotted border-sand" />
					<div
						aria-hidden
						className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-accent transition-all duration-500"
						style={{ left: `${pct}%` }}
					/>
				</div>
			</div>

			<Plate className="p-5 sm:p-6">
				<p className="mb-4 font-heading text-lg font-semibold">{index + 1}. {q.stem}</p>
				<div className="grid gap-2">
					{q.options.map((opt, oi) => {
						const isChosen = chosen === oi;
						const cls =
							status === "correct" && isChosen
								? "border-emerald-500 bg-emerald-50 text-emerald-800"
								: status === "wrong" && isChosen
									? "border-accent bg-accent/10 text-accent-strong"
									: "border-border hover:border-primary";
						return (
							<button
								key={oi}
								type="button"
								onClick={() => pick(oi)}
								disabled={locked}
								className={`rounded-md border px-4 py-2.5 text-left transition disabled:cursor-default ${cls}`}
							>
								{opt}
								{status === "correct" && isChosen && <span className="ml-2 text-emerald-600">✓</span>}
								{status === "wrong" && isChosen && <span className="ml-2 text-accent-strong">✗</span>}
							</button>
						);
					})}
				</div>

				{status === "correct" && (
					<div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
						<strong>{t("practice.correct")} ✓</strong>
						{explanation ? <span> — {explanation}</span> : null}
					</div>
				)}
				{status === "wrong" && hint && (
					<div className="mt-4 rounded-md bg-sand/30 p-3 text-sm">
						<strong>{t("practice.wrong")} ✗</strong> — {t("practice.hint")}: {hint}
					</div>
				)}

				{status === "correct" && (
					<button
						type="button"
						onClick={goNext}
						className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 font-semibold text-on-accent transition hover:bg-accent-strong"
					>
						{isLast ? t("practice.submit") : t("practice.next")}
						<span aria-hidden="true">→</span>
					</button>
				)}
			</Plate>
		</div>
	);
}

export function PracticeReview({ items }: { items: ReviewItem[] }) {
	return (
		<>
			{items.map((it, i) => (
				<div key={i} className={`paper rounded-lg border p-5 ${it.ok ? "border-emerald-300" : "border-accent/40"}`}>
					<p className="mb-2 font-medium">{i + 1}. {it.stem}</p>
					<div className="grid gap-1.5 text-sm">
						{it.options.map((opt, oi) => {
							const isCorrect = oi === it.correctIndex;
							const isChosen = oi === it.chosen;
							return (
								<div key={oi} className={`rounded-lg px-3 py-2 ${isCorrect ? "bg-emerald-50 text-emerald-800" : isChosen ? "bg-accent/10 text-accent-strong" : ""}`}>
									{isCorrect ? "✓ " : isChosen ? "✗ " : ""}{opt}
									{isCorrect && <span className="ml-2 text-xs">({t("practice.correct_answer")})</span>}
								</div>
							);
						})}
					</div>
					{it.explanation && <p className="mt-3 rounded-md bg-sand/30 p-3 text-sm">{t("practice.explanation")}: {it.explanation}</p>}
				</div>
			))}
		</>
	);
}

export function Expired({ retryTo, message }: { retryTo: string; message?: string }) {
	// `message` acoperă cazul limitării de rată: altfel utilizatorul ar citi „testul a expirat"
	// când de fapt a apăsat prea des, iar mesajul întors de server n-ar ajunge niciodată pe ecran.
	return (
		<div className="cat-rise grid place-items-center gap-4 py-16 text-center">
			<p className="text-muted">{message ?? "Testul a expirat. Începe unul nou."}</p>
			<Link to={retryTo} className="rounded-md bg-accent px-5 py-2.5 font-medium text-on-accent hover:bg-accent-strong">
				{t("practice.cta")}
			</Link>
		</div>
	);
}
