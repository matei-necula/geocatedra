import { redirect, useActionData } from "react-router";
import type { Route } from "./+types/admin.intrebari.nou";
import { subjectConfig } from "../config/subject";
import { getDb } from "../db/client";
import { getAdminSession } from "../lib/session";
import { getSecrets } from "../lib/env";
import { createQuestion, questionInputFromForm } from "../lib/questions";
import { AdminShell } from "../components/AdminShell";
import { QuestionForm } from "../components/QuestionForm";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Întrebare nouă", path: "/admin/intrebari/nou", noindex: true });
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const admin = await getAdminSession(request, getSecrets(context.cloudflare.env).sessionSecret);
	if (!admin) throw redirect("/admin/login");
	return null;
}

export async function action({ request, context }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");

	const db = getDb(env);
	const input = await questionInputFromForm(db, await request.formData());
	if (!input.stem) return { error: "Scrie întrebarea." };
	if (input.options.length < 2) return { error: "Adaugă cel puțin două variante." };
	await createQuestion(db, input);
	throw redirect("/admin/intrebari");
}

export default function IntrebareNoua() {
	const actionData = useActionData<typeof action>();
	return (
		<AdminShell title="Întrebare nouă">
			<QuestionForm grades={subjectConfig.grades} topics={subjectConfig.topics} mode="create" error={actionData?.error} />
		</AdminShell>
	);
}
