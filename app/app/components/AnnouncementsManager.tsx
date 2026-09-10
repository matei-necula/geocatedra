import { Form } from "react-router";
import { t } from "../config/subject";
import type { Announcement } from "../db/schema";

export interface TokenOption {
	id: string;
	label: string;
}

export function AnnouncementsManager({
	announcements,
	grades,
	tokensByGrade,
	tokenLabels,
	error,
}: {
	announcements: Announcement[];
	grades: { id: string; label: string }[];
	tokensByGrade: Record<string, TokenOption[]>;
	tokenLabels: Record<string, string>; // token id -> label (for the list; missing id = deleted class)
	error?: string;
}) {
	const fmt = (ts: number) => new Date(ts).toLocaleDateString("ro-RO");
	const toDateInput = (ts: number | null) => (ts ? new Date(ts).toISOString().slice(0, 10) : "");
	const now = Date.now();
	return (
		<div className="grid gap-8">
			<Form method="post" className="plate paper grid gap-4 p-6">
				<h2 className="font-heading text-lg font-semibold">{t("announcements.new")}</h2>
				<input type="hidden" name="intent" value="create" />
				<div className="grid gap-4 sm:grid-cols-2">
					<label className="grid gap-1.5 text-sm">
						<span className="text-muted">Clasa (an de studiu)</span>
						<select name="gradeId" required className="rounded-md border border-border bg-bg px-3 py-2.5">
							{grades.map((g) => (
								<option key={g.id} value={g.id}>{g.label}</option>
							))}
						</select>
					</label>
					<label className="grid gap-1.5 text-sm">
						<span className="text-muted">Doar pentru clasa…</span>
						<select name="tokenId" className="rounded-md border border-border bg-bg px-3 py-2.5">
							<option value="">{t("announcements.target_all")}</option>
							{Object.entries(tokensByGrade).flatMap(([gid, toks]) =>
								toks.map((tk) => (
									<option key={tk.id} value={tk.id}>
										{grades.find((g) => g.id === gid)?.label} · {tk.label}
									</option>
								)),
							)}
						</select>
					</label>
				</div>
				<label className="grid gap-1.5 text-sm">
					<span className="text-muted">{t("announcements.body")}</span>
					<textarea name="body" required rows={3} maxLength={2000} className="rounded-md border border-border bg-bg px-3 py-2.5" />
				</label>
				<div className="flex flex-wrap items-center gap-5">
					<label className="flex items-center gap-2 text-sm">
						<input type="checkbox" name="pinned" /> {t("announcements.pinned")}
					</label>
					<label className="flex items-center gap-2 text-sm">
						<span className="text-muted">{t("announcements.expires")}</span>
						<input type="date" name="expiresAt" className="rounded-md border border-border bg-bg px-2 py-1.5" />
					</label>
				</div>
				{error && <p className="rounded-md bg-accent/10 px-3 py-2 text-sm text-accent-strong">{error}</p>}
				<button className="justify-self-start rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-strong">
					{t("announcements.publish")}
				</button>
			</Form>

			{announcements.length === 0 ? (
				<p className="rounded-xl border border-dashed border-border p-6 text-center text-muted">{t("announcements.empty")}</p>
			) : (
				<div className="grid gap-3">
					{announcements.map((a) => {
						const expired = a.expiresAt != null && a.expiresAt <= now;
						const target = a.tokenId ? (tokenLabels[a.tokenId] ?? t("announcements.deleted_class")) : t("announcements.target_all");
						return (
							<div key={a.id} className={`rounded-xl border border-border bg-surface p-4 ${expired ? "opacity-60" : ""}`}>
								<div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
									{a.pinned === 1 && <span className="rounded bg-sand/40 px-1.5 py-0.5 font-medium">📌 {t("announcements.pinned")}</span>}
									<span>{grades.find((g) => g.id === a.gradeId)?.label ?? a.gradeId}</span>
									<span>· {target}</span>
									<span>· {fmt(a.createdAt)}</span>
									{expired && <span className="rounded bg-ink/10 px-1.5 py-0.5">{t("announcements.expired")}</span>}
								</div>
								<p className="whitespace-pre-line text-sm">{a.body}</p>
								<div className="mt-2 flex items-center gap-4">
									<details>
										<summary className="cursor-pointer text-sm font-medium text-primary">Editează</summary>
										<Form method="post" className="mt-3 grid gap-3">
											<input type="hidden" name="intent" value="update" />
											<input type="hidden" name="id" value={a.id} />
											<textarea name="body" defaultValue={a.body} required rows={3} maxLength={2000} className="rounded-md border border-border bg-bg px-3 py-2.5 text-sm" />
											<div className="flex flex-wrap items-center gap-5 text-sm">
												<label className="flex items-center gap-2">
													<input type="checkbox" name="pinned" defaultChecked={a.pinned === 1} /> {t("announcements.pinned")}
												</label>
												<input type="date" name="expiresAt" defaultValue={toDateInput(a.expiresAt)} className="rounded-md border border-border bg-bg px-2 py-1.5" />
												<button className="rounded-md bg-primary px-3 py-1.5 font-semibold text-on-primary hover:bg-primary-strong">{t("announcements.save")}</button>
											</div>
										</Form>
									</details>
									<Form method="post" onSubmit={(e) => { if (!confirm(t("announcements.delete_confirm"))) e.preventDefault(); }}>
										<input type="hidden" name="intent" value="delete" />
										<input type="hidden" name="id" value={a.id} />
										<button className="text-sm font-medium text-accent-strong hover:underline">Șterge</button>
									</Form>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
