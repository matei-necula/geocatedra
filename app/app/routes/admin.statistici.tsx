import { redirect } from "react-router";
import type { Route } from "./+types/admin.statistici";
import { t } from "../config/subject";
import { getDb } from "../db/client";
import { getAdminSession } from "../lib/session";
import { getSecrets } from "../lib/env";
import { bucharestDay, pruneViewStats, topMaterials, unviewedMaterials, viewsPerClass, viewsPerDay } from "../lib/viewstats";
import { AdminShell } from "../components/AdminShell";
import { StatsView, type StatsData } from "../components/StatsView";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: t("stats.title"), path: "/admin/statistici", noindex: true });
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function loadStats(db: ReturnType<typeof getDb>, tokenIds?: string[]): Promise<StatsData> {
	const since = bucharestDay(new Date(Date.now() - 30 * DAY_MS));
	await pruneViewStats(db, bucharestDay(new Date(Date.now() - 400 * DAY_MS)));
	const [perDay, top, perClass, unviewed] = await Promise.all([
		viewsPerDay(db, since, tokenIds),
		topMaterials(db, tokenIds, 10),
		viewsPerClass(db, since, tokenIds),
		unviewedMaterials(db, tokenIds),
	]);
	return { perDay, top, perClass, unviewed, totalViews30: perDay.reduce((s, d) => s + d.views, 0) };
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");
	return { stats: await loadStats(getDb(env)) };
}

export default function AdminStatistici({ loaderData }: Route.ComponentProps) {
	return (
		<AdminShell title={t("stats.title")}>
			<StatsView stats={loaderData.stats} resultsPath="/admin/rezultate" />
		</AdminShell>
	);
}
