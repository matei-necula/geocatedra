import { Link } from "react-router";
import { t } from "../../config/subject";
import { LiberFooter, LiberHeader } from "./LiberChrome";
import { Photo } from "./Photo";
import { useReveal } from "../../lib/motion";

/**
 * Pagina de start a instanței libere.
 *
 * Ordinea straturilor e o decizie, nu o întâmplare. Site-ul liber e SINGURA suprafață a
 * proiectului găsită de un străin — omul vine de pe Google sau dintr-un link pe WhatsApp și
 * n-are nicio idee ce e aici. Varianta veche îi arăta un titlu și două dreptunghiuri goale,
 * adică îi cerea să aleagă o ușă înainte să afle ce e în casă.
 *
 * Acum: întâi vede DESPRE CE e (fotografia + titlul), apoi vede CE E ÎNĂUNTRU (materiale
 * adevărate, aduse din bibliotecă), și abia apoi i se cere să aleagă o ușă.
 */
export function HomeLiber({ thumbs }: { thumbs: string[] }) {
	const reveal = useReveal();

	return (
		<>
			<LiberHeader />

			{/* Eroul. Textul stă pe un gradient, nu direct pe fotografie: luminozitatea unei
			    fotografii nu e sub controlul nostru, iar un titlu alb peste un cer deschis
			    devine ilizibil. Gradientul garantează contrastul indiferent de imagine. */}
			<section className="relative isolate">
				<Photo
					name="erou"
					priority
					width={1920}
					height={720}
					sizes="100vw"
					className="h-[52vh] max-h-[520px] min-h-[320px] w-full object-cover"
				/>
				<div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/15" />
				<div className="absolute inset-0 flex items-end">
					<div className="mx-auto w-full max-w-5xl px-5 pb-10 sm:pb-14">
						<p className="font-heading text-lg text-white/85 italic">{t("liber.hero.lead")}</p>
						<h1 className="font-heading mt-2 max-w-3xl text-4xl leading-[1.05] text-white sm:text-6xl">
							{t("liber.hero.title")}
						</h1>
						<Link
							to="/elevi"
							viewTransition
							className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 text-base font-semibold text-on-accent transition hover:bg-accent-strong"
						>
							{t("liber.hero.cta")}
						</Link>
					</div>
				</div>
			</section>

			<main id="continut" tabIndex={-1} className="mx-auto max-w-5xl px-5">
				{/* Materiale adevărate, nu capturi de ecran și nu promisiuni. Se ascunde singură
				    dacă biblioteca n-a răspuns — pagina rămâne întreagă fără ea. */}
				{thumbs.length > 0 && (
					<section ref={reveal} className="mt-10">
						<h2 className="font-heading text-sm tracking-wide text-muted uppercase">
							{t("liber.strip.title")}
						</h2>
						<ul className="mt-3 -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
							{thumbs.map((id) => (
								<li key={id} className="w-40 shrink-0 snap-start sm:w-52">
									<img
										src={`/media/${id}?t`}
										alt=""
										aria-hidden
										loading="lazy"
										decoding="async"
										width={208}
										height={117}
										className="aspect-video w-full rounded-md border border-border bg-surface object-cover"
									/>
								</li>
							))}
						</ul>
					</section>
				)}

				{/* Cele două uși, egale — decizia proprietarei. Egale ca mărime, ca greutate
				    tipografică și ca fotografie: niciuna nu e „principala". */}
				<section ref={reveal} className="mt-10 grid gap-5 sm:grid-cols-2">
					{[
						{ to: "/elevi", img: "elevi", title: "liber.door.elevi", desc: "liber.door.elevi.desc", cta: "liber.door.elevi.cta" },
						{ to: "/pedagogie", img: "profesori", title: "liber.door.profesori", desc: "liber.door.profesori.desc", cta: "liber.door.profesori.cta" },
					].map((d) => (
						<Link
							key={d.to}
							to={d.to}
							viewTransition
							className="group glow flex flex-col overflow-hidden rounded-lg border border-border bg-surface"
						>
							<Photo
								name={d.img}
								width={640}
								height={280}
								sizes="(min-width: 640px) 50vw, 100vw"
								className="h-40 w-full object-cover"
							/>
							<div className="flex flex-1 flex-col p-6">
								<h2 className="font-heading text-2xl group-hover:text-primary">{t(d.title)}</h2>
								<p className="mt-2 mb-5 text-sm text-muted">{t(d.desc)}</p>
								<span className="mt-auto inline-block self-start rounded-lg border border-border px-4 py-2 text-sm font-semibold transition group-hover:border-primary">
									{t(d.cta)}
								</span>
							</div>
						</Link>
					))}
				</section>

				{/* Invitația la păreri: o bandă, nu un card, ca să nu concureze cu cele două uși de
				    deasupra. Linkul din subsol rămâne — el e cel care apare pe FIECARE pagină; ăsta
				    e cel pe care îl vede cineva care ajunge prima dată pe pagina de start. */}
				<section ref={reveal} className="mt-10">
					<div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 className="font-heading text-2xl">{t("reviews.invite.title")}</h2>
							<p className="mt-1 max-w-prose text-sm text-muted">{t("reviews.invite.text")}</p>
						</div>
						<Link
							to="/pareri"
							viewTransition
							className="glow shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary"
						>
							{t("reviews.invite.cta")}
						</Link>
					</div>
				</section>

				<LiberFooter />
			</main>
		</>
	);
}
