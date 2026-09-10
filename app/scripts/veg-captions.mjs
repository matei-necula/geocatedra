// Rescrie legendele slide-urilor de vegetație din galeria „Zonele biogeografice",
// adăugând stația de referință și mediile anuale calculate din climate-data.mjs.
import { readFileSync, writeFileSync } from "node:fs";
import { ZONES } from "../../content/games/gen/climate-data.mjs";

const MAP = {
	"02-ecuatoriale-vegetatie": ["ecuatorial", "Pădurea ecuatorială – vegetație veșnic verde, etajată pe mai multe niveluri"],
	"05-savana-vegetatie": ["subecuatorial", "Savana – ierburi înalte cu acacii izolate, verzi în sezonul ploios și uscate în cel secetos"],
	"08-pustiuri-tropicale-vegetatie": ["tropical-uscat", "Pustiul tropical – dune și oază cu curmali, vegetație doar acolo unde există apă"],
	"11-maquis-vegetatie": ["mediteranean", "Maquis-ul mediteranean – tufișuri veșnic verzi, cu frunze mici și tari, adaptate la vara secetoasă"],
	"12-subtropicala-umeda-vegetatie": ["subtropical-umed", "Pădurea subtropicală umedă – arbori acoperiți de ferigi și epifite, verzi tot anul"],
	"16-foioase-vegetatie": ["temperat-oceanic", "Pădurea de foioase – arbori care își pierd frunzele iarna"],
	"19-stepa-vegetatie": ["stepa", "Stepa – întindere de ierburi, fără arbori, cu rădăcini adânci"],
	"20-pustiuri-reci-vegetatie": ["pustiu-rece", "Pustiul rece – ierburi rare și tufe pipernicite la poalele munților"],
	"24-conifere-vegetatie": ["taiga", "Taigaua – pădure de molizi, brazi și pini, cu frunze-ace care rezistă la ger"],
	"27-tundra-vegetatie": ["subpolar", "Tundra – mușchi, licheni și tufe pitice pe sol permanent înghețat în adânc"],
	"28-desert-polar-vegetatie": ["polar", "Deșertul polar – gheață și stâncă golașă, aproape lipsit de vegetație"],
};
const r1 = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(".", ","); // zecimale cu virgulă, ca în română

const [manifestPath] = process.argv.slice(2);
const man = JSON.parse(readFileSync(manifestPath, "utf8"));
let n = 0;
for (const img of man[0].images) {
	const name = img.file.split("/").pop().replace(".webp", "");
	const m = MAP[name];
	if (!m) continue;
	const z = ZONES[m[0]];
	const tMed = r1(z.t.reduce((a, b) => a + b, 0) / 12);
	const ampl = Math.max(...z.t) - Math.min(...z.t);
	const pTot = z.p.reduce((a, b) => a + b, 0);
	img.caption = `${m[1]}. Climograma zonei (${z.ref}): temperatură medie anuală ${tMed} °C, amplitudine termică ${ampl} °C, ${pTot} mm de precipitații pe an.`;
	n++;
}
writeFileSync(manifestPath, JSON.stringify(man, null, "\t") + "\n", "utf8");
console.log(`${n} legende rescrise`);
for (const img of man[0].images) if (MAP[img.file.split("/").pop().replace(".webp", "")]) console.log("  " + img.caption);
