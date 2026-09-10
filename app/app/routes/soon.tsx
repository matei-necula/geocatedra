import { Link, redirect } from "react-router";
import type { Route } from "./+types/soon";
import { subjectConfig, t } from "../config/subject";
import { SiteHeader } from "../components/site";
import { seo } from "../lib/seo";

const roleLabels: Record<string, string> = {
	teachers: t("role.teachers"),
};

export function loader({ params, request }: Route.LoaderArgs) {
	// „Public" a devenit vitrina propriu-zisă; vechea adresă nu mai are ce anunța.
	if (params.role === "public") throw redirect("/demo", 301);
	return {
		role: roleLabels[params.role] ?? params.role,
		origin: new URL(request.url).origin,
	};
}

export function meta({ data, params }: Route.MetaArgs) {
	return seo({
		title: data?.role ?? params.role,
		description: t("soon.desc"),
		path: `/info/${params.role}`,
		origin: data?.origin,
	});
}

export default function Soon({ loaderData }: Route.ComponentProps) {
	return (
		<div className="min-h-screen">
			<SiteHeader />
			<main className="mx-auto grid max-w-xl place-items-center px-5 py-24 text-center">
				<div className="cat-rise">
					<span className="inline-block rounded-full bg-sand/40 px-4 py-1.5 text-sm font-semibold">
						{t("soon")}
					</span>
					<h1 className="mt-4 text-3xl font-bold">{loaderData.role}</h1>
					<p className="mt-3 text-muted">{t("soon.desc")}</p>
					<Link
						to="/"
						className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 font-medium text-on-primary transition hover:bg-primary-strong"
					>
						← {subjectConfig.siteName}
					</Link>
				</div>
			</main>
		</div>
	);
}
