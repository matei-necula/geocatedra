import { redirect, useActionData } from "react-router";
import type { Route } from "./+types/admin.intrebari.$id";
import { subjectConfig } from "../config/subject";
import { getDb } from "../db/client";
import { getAdminSession } from "../lib/session";
import { getSecrets } from "../lib/env";
import { getQuestion, questionInputFromForm, updateQuestion } from "../lib/questions";
import { AdminShell } from "../components/AdminShell";
import { QuestionForm } from "../components/QuestionForm";
import { seo } from "../lib/seo";

export function meta(_: Route.MetaArgs) {
	return seo({ title: "Editează întrebarea", path: "/admin/intrebari/:id", noindex: true });
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");
	const question = await getQuestion(getDb(env), params.id, subjectConfig.defaultLocale);
	if (!question) throw new Response("Not found", { status: 404 });
	return { question };
}

export async function action({ request, context, params }: Route.ActionArgs) {
	const env = context.cloudflare.env;
	const admin = await getAdminSession(request, getSecrets(env).sessionSecret);
	if (!admin) throw redirect("/admin/login");

	const db = getDb(env);
	const input = await questionInputFromForm(db, await request.formData());
	if (!input.stem) return { error: "Scrie întrebarea." };
	if (input.options.length < 2) return { error: "Adaugă cel puțin două variante." };
	await updateQuestion(db, params.id, input);
	throw redirect("/admin/intrebari");
}

export default function IntrebareEdit({ loaderData }: Route.ComponentProps) {
	const actionData = useActionData<typeof action>();
	return (
		<AdminShell title="Editează întrebarea">
			<QuestionForm
				grades={subjectConfig.grades}
				topics={subjectConfig.topics}
				initial={loaderData.question}
				mode="edit"
				error={actionData?.error}
			/>
		</AdminShell>
	);
}
