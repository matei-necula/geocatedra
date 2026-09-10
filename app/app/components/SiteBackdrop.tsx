import { subjectConfig } from "../config/subject";
import { themeFor } from "../lib/theme";
import { BUILD_SITE_MODE } from "../lib/site-mode";

/**
 * Textura de fundal a site-ului — curbe de nivel și cercuri de hartă, foarte discrete.
 *
 * De ce un strat GLOBAL și nu componenta `ContourField` pusă pe fiecare pagină: `ContourField`
 * e legată de eroul paginii (`absolute inset-0` într-un părinte poziționat), deci o pagină care
 * uită s-o pună rămâne goală, iar una lungă are motiv doar în primul ecran. Stratul ăsta e
 * `fixed`, deci acoperă fereastra pe toată derularea și pe toate rutele, fără ca vreo pagină
 * să trebuiască să știe de el.
 *
 * Se randează o singură dată, din `root.tsx`, și doar dacă tema instanței cere un motiv
 * (`theme.motif`). E `aria-hidden` și `pointer-events-none`: e decor, nu conținut.
 *
 * Culorile vin din jetoane, deci motivul se schimbă singur între cele două instanțe și între
 * modul luminos și cel întunecat. `sand` e o nuanță de HÂRTIE în ambele teme (nu de cerneală),
 * tocmai ca desenul să rămână o textură, nu un desen peste care se citește greu.
 */
export function SiteBackdrop() {
	const theme = themeFor(subjectConfig, BUILD_SITE_MODE);
	if ((theme.motif ?? "none") === "none") return null;

	return (
		<div aria-hidden className="cat-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden">
			<svg
				className="absolute inset-0 h-full w-full"
				viewBox="0 0 1440 900"
				preserveAspectRatio="xMidYMid slice"
				fill="none"
			>
				{/* Curbe de nivel — trei familii la adâncimi diferite, ca să nu citească a grilă. */}
				<g stroke="var(--color-sand)" strokeWidth="1.4" opacity="0.75">
					<path d="M-60 140 C 220 60, 430 210, 700 150 S 1150 30, 1500 160" />
					<path d="M-60 210 C 230 130, 440 285, 710 225 S 1160 105, 1500 235" />
					<path d="M-60 285 C 245 205, 455 360, 725 300 S 1170 180, 1500 312" />
				</g>
				<g stroke="var(--color-primary)" strokeWidth="1" opacity="0.13">
					<path d="M-60 470 C 260 385, 500 545, 780 470 S 1200 350, 1500 490" />
					<path d="M-60 560 C 270 475, 510 635, 790 560 S 1210 440, 1500 580" />
					<path d="M-60 655 C 280 570, 520 730, 800 655 S 1220 535, 1500 675" />
				</g>
				{/* Cercuri de hartă — două ancore, ca în colțul unei planșe de atlas. */}
				<g stroke="var(--color-sand)" strokeWidth="1.1" opacity="0.6">
					<circle cx="1180" cy="200" r="52" />
					<circle cx="1180" cy="200" r="92" />
					<circle cx="1180" cy="200" r="136" />
				</g>
				<g stroke="var(--color-sand)" strokeWidth="1.1" opacity="0.45">
					<circle cx="180" cy="740" r="40" />
					<circle cx="180" cy="740" r="74" />
				</g>
			</svg>
		</div>
	);
}
