import { redirect } from "react-router";
import type { Route } from "./+types/profesor.statistici";
import { t } from "../config/subject";
import { getDb } from "../db/client";
import { getTeacher } from "../lib/guard";
import { listTokensByIssuer } from "../lib/tokens";
import { TeacherShell } from "../components/TeacherShell";
import { StatsView } from "../components/StatsView";
import { loadStats } from "./admin.statistici";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: t("stats.title"), path: "/profesor/statistici", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");
	const db = getDb(env);
	const tokenIds = (await listTokensByIssuer(db, teacher.id)).map((tk) => tk.id);
	// inArray with an empty array is invalid in Drizzle — a sentinel keeps the scope non-empty.
	const scope = tokenIds.length > 0 ? tokenIds : ["__none__"];
	return { stats: await loadStats(db, scope), email: teacher.email };
}

export default function ProfesorStatistici({ loaderData }: Route.ComponentProps) {
	return (
		<TeacherShell title={t("stats.title")} active="statistici" email={loaderData.email}>
			<StatsView stats={loaderData.stats} resultsPath="/profesor/rezultate" />
		</TeacherShell>
	);
}
