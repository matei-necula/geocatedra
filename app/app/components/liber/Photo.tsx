/**
 * O fotografie de decor din `public/img/`, servită în AVIF cu rezervă WebP.
 *
 * Trei lucruri sunt obligatorii aici și niciunul nu e cosmetic:
 *
 *  - `width`/`height` explicite, ca browserul să rezerve locul înainte să vină imaginea.
 *    Fără ele, textul de sub fotografie sare când se încarcă (CLS), iar pe telefon exact
 *    asta face un sit să pară prost făcut.
 *  - `sizes`, ca browserul să aleagă lățimea potrivită. Fără el presupune lățimea ecranului
 *    și descarcă varianta de 1920 și pe un telefon.
 *  - AVIF întâi. E cu ~35% mai mic decât WebP la aceeași calitate; browserele care nu-l știu
 *    trec singure pe `<source>`-ul următor.
 *
 * `alt=""` peste tot: fotografiile astea sunt DECOR. Nu poartă informație pe care un elev
 * care nu vede ar pierde-o, iar un `alt` descriptiv le-ar face doar zgomot la cititorul de
 * ecran. Fotografiile care chiar poartă conținut sunt cele din materiale, servite din R2.
 */
export function Photo({
	name,
	className = "",
	sizes = "100vw",
	priority = false,
	width,
	height,
}: {
	/** Numele din `public/img/`, fără lățime și fără extensie: „erou", „elevi", „profesori". */
	name: string;
	className?: string;
	sizes?: string;
	/** Doar pentru fotografia de deasupra liniei de plutire — cel mult una pe pagină. */
	priority?: boolean;
	width: number;
	height: number;
}) {
	const set = (ext: string) =>
		[640, 1280, 1920].map((w) => `/img/${name}-${w}.${ext} ${w}w`).join(", ");

	return (
		<picture>
			<source type="image/avif" srcSet={set("avif")} sizes={sizes} />
			<source type="image/webp" srcSet={set("webp")} sizes={sizes} />
			<img
				src={`/img/${name}-1280.webp`}
				alt=""
				width={width}
				height={height}
				loading={priority ? "eager" : "lazy"}
				fetchPriority={priority ? "high" : undefined}
				decoding={priority ? "sync" : "async"}
				className={className}
			/>
		</picture>
	);
}
