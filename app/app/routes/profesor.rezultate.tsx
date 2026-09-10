import { redirect } from "react-router";
import type { Route } from "./+types/profesor.rezultate";
import { gradeById, subjectConfig } from "../config/subject";
import { getDb } from "../db/client";
import { getTeacher } from "../lib/guard";
import { getResults } from "../lib/questions";
import { releaseNickname } from "../lib/nicknames";
import { listAssignmentsByOwner, getAssignmentResults } from "../lib/assignments";
import { TeacherShell } from "../components/TeacherShell";
import { ResultsView } from "../components/ResultsView";
import { AssignmentResults } from "../components/AssignmentResults";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Rezultate", path: "/profesor/rezultate", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");
	const gradeParam = new URL(request.url).searchParams.get("grade") || "";
	const gradeFilter = gradeById(gradeParam) ? gradeParam : "";
	const db = getDb(env);
	const results = await getResults(db, { gradeId: gradeFilter || undefined, owner: teacher.id });
	const teme = await listAssignmentsByOwner(db, teacher.id);
	const temaParam = new URL(request.url).searchParams.get("tema") || "";
	const selectedTema = teme.find((a) => a.id === temaParam) ?? null;
	const temaResults = selectedTema ? await getAssignmentResults(db, selectedTema) : null;
	return { results, grades: subjectConfig.grades, selectedGrade: gradeFilter, email: teacher.email, teme, selectedTema, temaResults };
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const teacher = await getTeacher(request, env);
	if (!teacher) throw redirect("/profesor/login");
	const form = await request.formData();
	if (String(form.get("intent")) === "release-nick") {
		const g = String(form.get("grade") || "");
		const nickname = String(form.get("nickname") || "");
		if (gradeById(g) && nickname) await releaseNickname(getDb(env), g, nickname);
	}
	return { ok: true };
}

export default function ProfesorRezultate({ loaderData }: Route.ComponentProps) {
	const { results, grades, selectedGrade, email, teme, selectedTema, temaResults } = loaderData;
	return (
		<TeacherShell title="Rezultate" active="rezultate" email={email}>
			<ResultsView results={results} grades={grades} selectedGrade={selectedGrade} basePath="/profesor/rezultate" releaseGrade={selectedGrade || undefined}>
				<AssignmentResults assignments={teme} selected={selectedTema} results={temaResults} basePath="/profesor/rezultate" temePath="/profesor/teme" />
			</ResultsView>
		</TeacherShell>
	);
}
