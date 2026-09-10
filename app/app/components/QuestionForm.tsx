import { useState } from "react";
import { Form, useNavigation } from "react-router";
import type { GradeDef, TopicDef } from "../config/types";
import type { AdminQuestionRow } from "../lib/questions";
import { QuestionEditor } from "./QuestionEditor";

const inputCls =
	"rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "grid gap-1.5 text-sm";

interface Props {
	grades: GradeDef[];
	topics: Record<string, TopicDef[]>;
	initial?: AdminQuestionRow;
	mode: "create" | "edit";
	error?: string;
}

export function QuestionForm({ grades, topics, initial, mode, error }: Props) {
	const nav = useNavigation();
	const [gradeId, setGradeId] = useState(initial?.gradeId ?? grades[0].id);
	const gradeTopics = topics[gradeId] ?? [];
	const [topicSlug, setTopicSlug] = useState(initial?.topicSlug ?? gradeTopics[0]?.slug ?? "");

	return (
		<Form method="post" className="grid gap-5">
			{error && <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-strong">{error}</p>}

			<div className="grid gap-4 sm:grid-cols-3">
				<label className={labelCls}>
					<span className="text-muted">Clasa</span>
					<select
						name="gradeId"
						value={gradeId}
						onChange={(e) => {
							setGradeId(e.target.value);
							setTopicSlug(topics[e.target.value]?.[0]?.slug ?? "");
						}}
						className={inputCls}
					>
						{grades.map((g) => (
							<option key={g.id} value={g.id}>{g.label}</option>
						))}
					</select>
				</label>
				<label className={labelCls}>
					<span className="text-muted">Tema</span>
					<select name="topicSlug" value={topicSlug} onChange={(e) => setTopicSlug(e.target.value)} className={inputCls}>
						{gradeTopics.map((tp) => (
							<option key={tp.slug} value={tp.slug}>{tp.label}</option>
						))}
					</select>
				</label>
				<label className={labelCls}>
					<span className="text-muted">Stare</span>
					<select name="status" defaultValue={initial?.status ?? "draft"} className={inputCls}>
						<option value="draft">Ciornă (ascuns)</option>
						<option value="published">Publicat (intră la exersare)</option>
					</select>
				</label>
			</div>

			<QuestionEditor
				initial={
					initial
						? { stem: initial.stem, options: initial.options, correctIndex: initial.correctIndex, explanation: initial.explanation }
						: undefined
				}
			/>

			<input type="hidden" name="position" value={initial?.position ?? ""} />

			<div className="flex gap-3">
				<button
					type="submit"
					disabled={nav.state !== "idle"}
					className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-on-primary transition hover:bg-primary-strong disabled:opacity-60"
				>
					{mode === "create" ? "Adaugă întrebarea" : "Salvează modificările"}
				</button>
				<a href="/admin/intrebari" className="rounded-lg px-5 py-2.5 font-medium text-muted hover:text-ink">
					Anulează
				</a>
			</div>
		</Form>
	);
}
