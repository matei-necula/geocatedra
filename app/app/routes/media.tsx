import type { Route } from "./+types/media";
import { getDb } from "../db/client";
import { getAsset, listAssets, thumbKey } from "../lib/assets";
import { getMaterialCore } from "../lib/content";
import { demoViewer, resolveViewer } from "../lib/guard";
import { resolveVisibility } from "../lib/entitlement";
import { assetAllowed, inDemoSet } from "../lib/demo";
import { mediaHeaders } from "../lib/headers";

// Resource route: streams a binary from R2 ONLY after a server-side access check.
// Binaries are never public — same anti-piracy floor as the rest of the app.
export async function loader({ request, context, params }: Route.LoaderArgs) {
	const env = context.cloudflare.env;
	const db = getDb(env);
	if (!env.MEDIA) throw new Response("Not found", { status: 404 });

	const asset = await getAsset(db, params.id);
	if (!asset) throw new Response("Not found", { status: 404 });

	const material = await getMaterialCore(db, asset.materialId);
	if (!material) throw new Response("Not found", { status: 404 });

	const { viewer } = await resolveViewer(request, env);
	// Rezolvăm întâi cu rolul real. Admin/profesor logat păstrează accesul lui, mai larg decât
	// al vizitatorului de vitrină. Dar un elev logat are un rol mai ÎNGUST (doar clasa lui) —
	// dacă rolul real nu ajunge la material, încercăm din nou ca vizitator anonim de vitrină,
	// exact ce ar vedea oricine de pe internet. `demoViewer()` oricum nu poate deschide altceva
	// decât cele cinci materiale curate (vezi `resolveVisibility` cazul "demo").
	let visibility = resolveVisibility(viewer, material);
	let effectiveRole = viewer.role;
	if (
		visibility !== "full" &&
		visibility !== "view_only" &&
		visibility !== "teaser" &&
		visibility !== "preview" &&
		inDemoSet(material.gradeId, material.slug)
	) {
		visibility = resolveVisibility(demoViewer(), material);
		effectiveRole = "demo";
	}
	if (
		visibility !== "full" &&
		visibility !== "view_only" &&
		visibility !== "teaser" &&
		visibility !== "preview"
	) {
		throw new Response("Forbidden", { status: 403 });
	}

	// Zidul, ținut aici, nu în UI: pagina 7 dintr-un teanc de profesor e refuzată chiar
	// și unei cereri fabricate de mână, cu id-ul assetului ghicit.
	if (visibility === "preview") {
		const pages = (await listAssets(db, material.id)).filter((a) => a.role === "image").length;
		if (!assetAllowed(asset.idx ?? -1, pages)) throw new Response("Forbidden", { status: 403 });
	}

	// Miniatura, dacă e cerută ȘI dacă există.
	//
	// Podeaua de acces e deja trecută, integral, mai sus — `?t` nu schimbă CE ai voie să vezi,
	// doar CÂT de mare. Nu poate deveni o portiță: cheia se compune din `asset.r2Key`, care a
	// trecut deja toate verificările, iar dacă obiectul mic nu există se servește originalul,
	// niciodată altceva.
	//
	// Fără asta, cardurile din `/elevi` ar fi tras imaginile la mărime naturală: 1074 de imagini
	// în bază, media 85 kB, maximul 915 kB — adică vreo 5 MB pe o pagină pe care elevii o
	// deschid de pe telefon, ca să vadă niște miniaturi de 400px.
	const wantsThumb = new URL(request.url).searchParams.has("t");
	let object = wantsThumb ? await env.MEDIA.get(thumbKey(asset.r2Key)) : null;
	const servedThumb = object !== null;
	if (!object) object = await env.MEDIA.get(asset.r2Key);
	if (!object) throw new Response("Not found", { status: 404 });

	// Poate intra imaginea asta în Google Images?
	//
	// Trei condiții, toate obligatorii, și niciuna nu ține de podeaua de acces — aceea a fost
	// deja trecută mai sus, iar un obiect la care n-ai drept a ieșit demult pe 403:
	//
	//  1. `effectiveRole === "liber"` — accesul a fost dat de instanța publică, unde materialul
	//     chiar e deschis oricui. Vitrina (`demo`) NU intră: sunt cinci materiale de marketing,
	//     iar unul dintre ele e un teanc de profesor tăiat la jumătate. Accesul propriu al unui
	//     elev, profesor sau admin cu atât mai puțin.
	//  2. `library === "student"` — biblioteca elevilor. Planșele de pedagogie sunt munca proprie
	//     a autoarei, scoasă din `.pptx`-urile ei, și rămân în afara căutării de imagini.
	//  3. `visibility === "full"` — nu `preview`, nu `teaser`, nu `view_only`. O pagină servită
	//     trunchiat n-are ce indexa.
	//
	// Motivarea lungă, cu ce s-a cântărit și ce s-a respins, stă la `indexable` în lib/headers.ts.
	const indexable = effectiveRole === "liber" && material.library === "student" && visibility === "full";

	// Antetele se construiesc într-un singur loc, pur și testat (lib/headers.ts): tip inline vs
	// attachment, `X-Robots-Tag` pe ce nu vrem indexat, `CORP` contra hotlinkului de pe alte
	// site-uri, și politica de cache.
	// „Public" doar când ACCESUL a fost acordat de rolul de vitrină, nu doar pentru că materialul
	// e în setul curat — accesul propriu al unui elev/admin rămâne privat.
	return new Response(object.body, {
		headers: mediaHeaders({
			// Miniatura e mereu WebP și are altă mărime decât originalul — dacă am fi lăsat
			// `asset.mime`/`asset.bytes`, browserul ar fi primit un Content-Length greșit.
			mime: servedThumb ? "image/webp" : asset.mime,
			bytes: servedThumb ? undefined : asset.bytes,
			// „Public" înseamnă cacheabil de oricine. Adevărat pentru vitrină și pentru toată
			// instanța liberă, unde binarele chiar sunt publice. Accesul propriu al unui
			// elev/profesor/admin rămâne privat, ca până acum.
			publicDemo: effectiveRole === "demo" || effectiveRole === "liber",
			indexable,
		}),
	});
}
