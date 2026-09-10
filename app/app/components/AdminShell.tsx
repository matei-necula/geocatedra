import { Form, Link, useLocation } from "react-router";
import { SiteHeader } from "./site";

const tabs = [
	{ to: "/admin", label: "Tokenuri" },
	{ to: "/admin/materiale", label: "Materiale" },
	{ to: "/admin/intrebari", label: "Întrebări" },
	{ to: "/admin/rezultate", label: "Rezultate" },
	{ to: "/admin/statistici", label: "Statistici" },
	{ to: "/admin/anunturi", label: "Anunțuri" },
	{ to: "/admin/pareri", label: "Păreri" },
	{ to: "/admin/profesori", label: "Profesori" },
];

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
	const { pathname } = useLocation();
	return (
		<div className="min-h-screen">
			<SiteHeader
				right={
					<Form method="post" action="/iesire" className="inline">
						<button
							type="submit"
							className="cursor-pointer text-sm font-medium text-muted hover:text-ink"
						>
							Ieși
						</button>
					</Form>
				}
			/>
			<div className="mx-auto max-w-4xl px-5 pt-6">
				{/* `flex-wrap`: al optulea tab („Păreri") nu mai încape pe un rând de telefon,
				    iar o bară de navigare tăiată de marginea ecranului ascunde secțiuni întregi. */}
				<nav className="mb-6 flex flex-wrap gap-1 border-b border-border">
					{tabs.map((tab) => {
						const active = tab.to === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.to);
						return (
							<Link
								key={tab.to}
								to={tab.to}
								viewTransition
								className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
									active
										? "border-primary text-primary"
										: "border-transparent text-muted hover:text-ink"
								}`}
							>
								{tab.label}
							</Link>
						);
					})}
				</nav>
				<h1 className="mb-6 text-3xl font-bold">{title}</h1>
				{children}
			</div>
		</div>
	);
}
