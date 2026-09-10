import type { MindNode } from "./types";

// ============================================================================
// CONCEPT MAPS (hărți conceptuale) — geography instance content.
// Keyed by `${gradeId}:${topicSlug}`. Each tree summarizes the KEY IDEAS of a
// lesson to help students understand it — it is NOT a list of materials.
// This is subject *content*; the engine renders it generically.
// ============================================================================

export const mindmaps: Record<string, MindNode> = {
	"9:atmosfera-caracteristici-climatice": {
		label: "Atmosfera și caracteristicile climatice",
		children: [
			{
				label: "Atmosfera",
				children: [
					{ label: "Învelișul de aer al Pământului" },
					{ label: "Compoziția: azot 78%, oxigen 21%, argon, CO₂" },
					{ label: "Forma: mai bombată la ecuator, mai subțire la poli" },
				],
			},
			{
				label: "Structura verticală",
				children: [
					{ label: "Troposfera (0–12 km) — vremea, norii, ~90% din masă" },
					{ label: "Stratosfera (12–50 km) — stratul de ozon" },
					{ label: "Mezosfera (50–80 km) — cele mai joase temperaturi" },
					{ label: "Termosfera / Ionosfera (80–1000 km) — aurorele polare" },
					{ label: "Exosfera (peste 1000 km) — trecerea spre spațiul cosmic" },
				],
			},
			{
				label: "Factorii genetici ai climei",
				children: [
					{ label: "Radiativi — radiația solară și bilanțul radiativ" },
					{ label: "Dinamici — circulația maselor de aer" },
					{ label: "Fizico-geografici — uscat/apă, relief, curenți oceanici" },
				],
			},
			{
				label: "Circulația generală a atmosferei",
				children: [
					{ label: "Calmul ecuatorial" },
					{ label: "Alizeele" },
					{ label: "Vânturile de vest" },
					{ label: "Vânturile polare" },
					{ label: "Curenții-jet" },
				],
			},
			{
				label: "Elementele climatice",
				children: [
					{ label: "Temperatura — izoterme (media globală ≈ 13 °C)" },
					{ label: "Precipitațiile — izohiete, tipuri și regimuri" },
					{ label: "Vânturile — regionale (musonii), locale (brizele, foehnul)" },
				],
			},
			{
				label: "De reținut",
				children: [
					{ label: "Troposfera este stratul în care se petrece vremea" },
					{ label: "Stratul de ozon ne protejează de radiațiile UV" },
					{ label: "Elementele climei: temperatura, precipitațiile, vântul" },
				],
			},
		],
	},

	"9:climatele-terrei": {
		label: "Climatele Terrei",
		children: [
			{
				label: "Factorii climei",
				children: [
					{ label: "Latitudinea (unghiul razelor) — factorul principal" },
					{ label: "Circulația maselor de aer și vânturile" },
					{ label: "Repartiția uscat – apă (oceanic vs continental)" },
					{ label: "Curenții oceanici" },
					{ label: "Relieful și altitudinea" },
				],
			},
			{
				label: "Elementele climei",
				children: [
					{ label: "Temperatura medie anuală (TMA)" },
					{ label: "Precipitațiile medii anuale (PMA)" },
					{ label: "Masele de aer" },
				],
			},
			{
				label: "Zona caldă",
				children: [
					{ label: "Ecuatorial" },
					{ label: "Subecuatorial" },
					{ label: "Tropical-arid" },
					{ label: "Tropical-musonic" },
				],
			},
			{
				label: "Zona temperată",
				children: [
					{ label: "Subtropical-mediteranean" },
					{ label: "Temperat-oceanic" },
					{ label: "Temperat-continental" },
					{ label: "Temperat-rece" },
					{ label: "Temperat-arid (Gobi)" },
				],
			},
			{
				label: "Zona rece",
				children: [
					{ label: "Subpolar" },
					{ label: "Polar" },
				],
			},
			{
				label: "De reținut",
				children: [
					{ label: "Trei zone climatice: caldă, temperată, rece" },
					{ label: "Simetrie de la Ecuator spre poli" },
				],
			},
		],
	},

	"9:dinamica-litosferei": {
		label: "Dinamica litosferei",
		children: [
			{
				label: "Plăcile tectonice",
				children: [
					{ label: "6 plăci majore + plăci medii" },
					{ label: "Scoarță continentală vs oceanică" },
					{ label: "Motorul: curenții de convecție din manta" },
				],
			},
			{
				label: "Contactele dintre plăci",
				children: [
					{ label: "Divergente — rift, dorsale" },
					{ label: "Convergente — subducție, fose / munți" },
					{ label: "Transformante — alunecare laterală" },
				],
			},
			{
				label: "Procese asociate",
				children: [
					{ label: "Cutremure (hipocentru, epicentru; Richter, Mercalli)" },
					{ label: "Vulcanism" },
					{ label: "Mișcări orogenetice și epirogenetice" },
					{ label: "Magmatism" },
				],
			},
			{
				label: "Vulcanismul",
				children: [
					{ label: "Aparatul vulcanic (vatră, coș, con, crater)" },
					{ label: "Lave bazice (efuzive) / acide (explozive)" },
					{ label: "Fenomene secundare (fumarole, mofete, gheizere)" },
					{ label: "Hot-spot (Hawaii)" },
				],
			},
			{
				label: "Relieful oceanic",
				children: [
					{ label: "Platforma și taluzul continental" },
					{ label: "Câmpia abisală" },
					{ label: "Dorsale și fose oceanice" },
				],
			},
			{
				label: "În România",
				children: [
					{ label: "Cutremurele adânci din Vrancea" },
					{ label: "Curbura Carpaților (microplăci)" },
					{ label: "Seismul din 4 martie 1977" },
				],
			},
		],
	},

	"9:hidrosfera": {
		label: "Hidrosfera",
		children: [
			{
				label: "Proprietățile apei",
				children: [
					{ label: "Fierbe la 100 °C, îngheață la 0 °C" },
					{ label: "Densitate maximă la +4 °C → gheața plutește" },
					{ label: "Dezagregă rocile prin îngheț" },
				],
			},
			{
				label: "Oceanul planetar",
				children: [
					{ label: "Pacific — Groapa Marianelor" },
					{ label: "Atlantic" },
					{ label: "Indian — cel mai cald" },
					{ label: "Arctic — cel mai mic" },
				],
			},
			{
				label: "Mările",
				children: [
					{ label: "Interioare, mediterane, interinsulare" },
					{ label: "Mărginașe și deschise" },
				],
			},
			{
				label: "Caracteristicile apei oceanice",
				children: [
					{ label: "Temperatura (scade spre poli și cu adâncimea)" },
					{ label: "Salinitatea (medie 35–37‰)" },
					{ label: "Culoare, transparență, densitate" },
				],
			},
			{
				label: "Dinamica apelor",
				children: [
					{ label: "Valuri (eoliene, tsunami)" },
					{ label: "Maree (Luna și Soarele)" },
					{ label: "Curenți calzi și reci" },
				],
			},
			{
				label: "Apele continentale",
				children: [
					{ label: "Ape curgătoare (pârâu, râu, fluviu)" },
					{ label: "Lacuri (naturale, antropice)" },
					{ label: "Ghețari (montani, de calotă)" },
				],
			},
			{
				label: "Apele subterane",
				children: [
					{ label: "Apa din porii și fisurile rocilor" },
					{ label: "Roci permeabile (nisip, pietriș) / impermeabile (argilă)" },
					{ label: "Strat acvifer (pânză de apă)" },
					{ label: "Freatice — cele mai de sus; dau fântâni și izvoare" },
					{ label: "Captive (de adâncime) — sub presiune: ascensionale, arteziene" },
					{ label: "Izvoare, ape minerale și termale" },
					{ label: "Rezervă de apă potabilă — de protejat de poluare" },
				],
			},
		],
	},

	"9:pamantul-caracteristici": {
		label: "Pământul – caracteristici",
		children: [
			{
				label: "Forma",
				children: [
					{ label: "Sferă → elipsoid" },
					{ label: "Geoid (nivelul 0 m)" },
					{ label: "Terroid (forma reală)" },
				],
			},
			{
				label: "Înclinarea axei",
				children: [
					{ label: "23°27′ față de verticală" },
					{ label: "66°33′ față de planul orbitei" },
					{ label: "Cauzează anotimpurile" },
				],
			},
			{
				label: "Gravitația și magnetismul",
				children: [
					{ label: "Gravitația scade de la poli spre Ecuator" },
					{ label: "Câmpul magnetic (nucleul extern)" },
					{ label: "Magnetosfera — scut, aurore polare" },
				],
			},
			{
				label: "Căldura internă",
				children: [
					{ label: "Treapta și gradientul geotermic" },
					{ label: "Radioactivitatea (~90%)" },
					{ label: "Căldura reziduală (~10%)" },
				],
			},
			{
				label: "Structura internă",
				children: [
					{ label: "Nucleu (intern solid, extern fluid)" },
					{ label: "Mantaua (astenosfera)" },
					{ label: "Scoarța (sedimentară, granitică, bazaltică)" },
					{ label: "Discontinuități" },
				],
			},
			{
				label: "Alcătuirea chimică",
				children: [
					{ label: "Sial – Sima – … – Nife (spre interior, metale grele)" },
					{ label: "Oxigen 47% + Siliciu 28%" },
					{ label: "Densitatea crește spre centru" },
				],
			},
		],
	},

	"9:pamantul-miscari": {
		label: "Mișcările Pământului",
		children: [
			{
				label: "Rotația",
				children: [
					{ label: "Sens V → E, ~24 h" },
					{ label: "Viteza unghiulară egală, liniară scade spre poli" },
				],
			},
			{
				label: "Consecințele rotației",
				children: [
					{ label: "Ziua și noaptea" },
					{ label: "Mișcarea aparentă a Soarelui" },
					{ label: "Forța Coriolis" },
					{ label: "Turtirea la poli" },
					{ label: "Fusele orare" },
				],
			},
			{
				label: "Fusele orare",
				children: [
					{ label: "24 de fuse × 15°" },
					{ label: "Timpul universal (Greenwich)" },
					{ label: "Linia de schimbare a datei (180°)" },
				],
			},
			{
				label: "Revoluția",
				children: [
					{ label: "În jurul Soarelui, orbită eliptică" },
					{ label: "365 zile și 6 h → anul bisect" },
					{ label: "Axa rămâne înclinată constant" },
				],
			},
			{
				label: "Momentele astronomice",
				children: [
					{ label: "Echinocții — 21 martie, 23 septembrie" },
					{ label: "Solstiții — 22 iunie, 22 decembrie" },
				],
			},
			{
				label: "Consecințele revoluției",
				children: [
					{ label: "Anotimpurile" },
					{ label: "Inegalitatea zi – noapte" },
					{ label: "Înălțimea Soarelui pe cer" },
					{ label: "Zonele de căldură (caldă, temperate, reci)" },
				],
			},
		],
	},

	"9:pamantul-reprezentare-harti": {
		label: "Reprezentarea pe hărți",
		children: [
			{
				label: "Proiecții cartografice",
				children: [
					{ label: "Cilindrică (Mercator — navigație)" },
					{ label: "Conică (latitudini medii)" },
					{ label: "Azimutală (regiuni polare)" },
					{ label: "Robinson / întreruptă" },
				],
			},
			{
				label: "Deformările",
				children: [
					{ label: "Suprafețe" },
					{ label: "Distanțe" },
					{ label: "Unghiuri / formă" },
				],
			},
			{
				label: "Caracteristicile hărții",
				children: [
					{ label: "Micșorată (scară)" },
					{ label: "Convențională (legendă)" },
					{ label: "Generalizată" },
					{ label: "Selectivă" },
				],
			},
			{
				label: "Conținutul hărții",
				children: [
					{ label: "Titlu și scară (numerică, grafică, directă)" },
					{ label: "Coordonate: latitudine, longitudine" },
					{ label: "Planimetrie și altimetrie" },
					{ label: "Legenda" },
				],
			},
			{
				label: "Relieful pe hartă",
				children: [
					{ label: "Curbe de nivel (aceeași altitudine, nu se intersectează)" },
					{ label: "Echidistanța" },
					{ label: "Curbe dese = pantă abruptă" },
					{ label: "Trepte de relief" },
				],
			},
			{
				label: "Tehnologii moderne",
				children: [
					{ label: "GIS (straturi de date)" },
					{ label: "Modelul numeric al terenului (DEM)" },
					{ label: "Teledetecția (imagini satelitare)" },
					{ label: "GPS" },
				],
			},
		],
	},

	"9:relieful-major": {
		label: "Relieful major",
		children: [
			{
				label: "Repartiția uscat – apă",
				children: [
					{ label: "Ape ~71% / uscat ~29%" },
					{ label: "Emisfera nordică = „a continentelor”" },
					{ label: "Patru oceane" },
				],
			},
			{
				label: "Altitudini și adâncimi extreme",
				children: [
					{ label: "Everest (~8850 m)" },
					{ label: "Marea Moartă (~−411 m)" },
					{ label: "Fosa Marianelor (~−11022 m)" },
				],
			},
			{
				label: "Treptele de relief",
				children: [
					{ label: "Munții (peste 800–1000 m)" },
					{ label: "Dealurile" },
					{ label: "Podișurile (culmi largi, netede)" },
					{ label: "Câmpiile (sub ~300 m)" },
				],
			},
			{
				label: "Elemente morfologice",
				children: [
					{ label: "Altitudinea absolută" },
					{ label: "Adâncimea și densitatea fragmentării" },
					{ label: "Panta" },
				],
			},
			{
				label: "Geneza treptelor",
				children: [
					{ label: "Munți — orogeneză + vulcanism" },
					{ label: "Dealuri și podișuri — cutare, acumulare, tocire" },
					{ label: "Câmpii — acumulare" },
				],
			},
			{
				label: "Orogeneza și nivelarea",
				children: [
					{ label: "Etapa de geosinclinal → etapa de orogen" },
					{ label: "Forțe interne vs forțe externe" },
					{ label: "Peneplena și pediplena" },
				],
			},
		],
	},

	"9:relieful-minor": {
		label: "Relieful minor",
		children: [
			{
				label: "Lanțul de bază",
				children: [
					{ label: "Agent → procese → forme" },
					{ label: "Dezagregare, eroziune, transport, acumulare, dizolvare" },
				],
			},
			{
				label: "Relieful apei curgătoare",
				children: [
					{ label: "Fluvial (văi, lunci, terase, delte)" },
					{ label: "Pluviodenudare (rigole, ravene)" },
					{ label: "Torențial (con de dejecție)" },
				],
			},
			{
				label: "Relieful gravitațional",
				children: [
					{ label: "Prăbușiri și alunecări de teren" },
					{ label: "Solifluxiune" },
					{ label: "Sufoziune și tasare (pe loess)" },
				],
			},
			{
				label: "Relieful glaciar și periglaciar",
				children: [
					{ label: "Glaciar montan (circuri, văi în U, morene)" },
					{ label: "Glaciar de calotă" },
					{ label: "Periglaciar (mări de pietre, babe)" },
				],
			},
			{
				label: "Relieful eolian și litoral",
				children: [
					{ label: "Deșertic (dune, barcane, erg, hamada, reg)" },
					{ label: "Litoral (faleze, plaje, cordoane, lagune)" },
				],
			},
			{
				label: "Rolul rocii și structurii (factori pasivi)",
				children: [
					{ label: "Carstic (doline, peșteri, stalactite)" },
					{ label: "Pe loess și argilă (crovuri, badlands)" },
					{ label: "Structural (cueste, horsturi, grabene)" },
					{ label: "Biogen și antropic (recifi, mine, baraje)" },
				],
			},
		],
	},

	"9:solurile-terrei": {
		label: "Solurile Terrei (pedosfera)",
		children: [
			{
				label: "Ce este solul",
				children: [
					{ label: "Fertilitatea — însușirea de bază" },
					{ label: "Pedosfera = ecosistem" },
					{ label: "Puntea dintre rocă și viață" },
				],
			},
			{
				label: "Factorii pedogenetici",
				children: [
					{ label: "Clima — cel mai important" },
					{ label: "Roca-mamă și vegetația" },
					{ label: "Organismele, apa, relieful" },
					{ label: "Timpul și omul" },
				],
			},
			{
				label: "Orizonturile solului",
				children: [
					{ label: "O — litiera" },
					{ label: "A — humus (bioacumulativ)" },
					{ label: "E — spălare (eluvial)" },
					{ label: "B — acumulare (iluvial)" },
					{ label: "C și R — roca-mamă" },
				],
			},
			{
				label: "Procese pedogenetice",
				children: [
					{ label: "Podzolire (umed și răcoros)" },
					{ label: "Calcifiere (secetos — cernoziom)" },
					{ label: "Lateritizare (cald și umed)" },
				],
			},
			{
				label: "Proprietățile solului",
				children: [
					{ label: "Fertilitatea și culoarea" },
					{ label: "Textura (nisip, praf, argilă)" },
					{ label: "Structura, porozitatea, pH-ul" },
				],
			},
			{
				label: "Tipuri zonale de sol",
				children: [
					{ label: "Fiecărei zone climatice îi corespunde un tip de sol" },
					{ label: "Subpolar (tundră) → sol de tundră" },
					{ label: "Temperat-rece (taiga) → sol podzolic" },
					{ label: "Temperat, pădure de foioase → sol cenușiu de pădure" },
					{ label: "Temperat-continental (stepă) → cernoziom" },
					{ label: "Subtropical umed → crasnoziom" },
					{ label: "Semiarid (semipustiu) → sol brun de semipustiu" },
					{ label: "Arid (pustiu) → sol brun-cenușiu de pustiu" },
					{ label: "Zone aride, saline → solonceac" },
				],
			},
		],
	},

	"9:tipuri-de-roci": {
		label: "Alcătuirea litosferei – minerale și roci",
		children: [
			{
				label: "Mineral și rocă",
				children: [
					{ label: "Mineral — compoziție chimică definită, structură ordonată" },
					{ label: "Rocă — agregat de unul sau mai multe minerale" },
					{ label: "Granitul: cuarț + feldspat + mica" },
				],
			},
			{
				label: "Categoriile de minerale",
				children: [
					{ label: "Elemente native — aur, cupru, sulf, grafit, diamant" },
					{ label: "Silicați — peste 90% din scoarță: cuarț, feldspat, mica" },
					{ label: "Oxizi — hematit, magnetit, bauxită, corindon" },
					{ label: "Carbonați — calcit, dolomit, malachit; fac efervescență" },
					{ label: "Sulfuri — pirită, galenă, blendă; luciu metalic" },
					{ label: "Sulfați — gips, anhidrit, celestină, baritină" },
					{ label: "Halogenuri — halit (sarea gemă), silvină, fluorină" },
					{ label: "Fosfați — apatit, turcoaz" },
				],
			},
			{
				label: "La ce folosesc mineralele",
				children: [
					{ label: "Minereuri — oxizii și sulfurile dau metalele" },
					{ label: "Construcții — var, ciment, ipsos din carbonați și sulfați" },
					{ label: "Sarea de bucătărie — din halogenuri" },
					{ label: "Îngrășăminte — din fosfați" },
					{ label: "Prețioase: diamant, rubin, safir, smarald" },
					{ label: "Semiprețioase: ametist, turcoaz, malachit, agat" },
				],
			},
			{
				label: "Roci magmatice",
				children: [
					{ label: "Intruzive (granit) — răcire lentă, cristale mari" },
					{ label: "Efuzive (bazalt) — răcire rapidă, cristale mici" },
					{ label: "Viteza de răcire hotărăște mărimea cristalelor" },
				],
			},
			{
				label: "Roci sedimentare",
				children: [
					{ label: "Detritice (gresie, conglomerat, argilă)" },
					{ label: "De precipitare chimică (sare, gips, calcar)" },
					{ label: "Organogene (cărbuni, petrol, calcar, cretă)" },
					{ label: "Dispuse în strate, cu fosile" },
				],
			},
			{
				label: "Roci metamorfice",
				children: [
					{ label: "Din transformare la presiuni și temperaturi mari" },
					{ label: "În stare solidă, fără topire" },
					{ label: "Gnais, marmură, cuarțit, ardezie" },
				],
			},
			{
				label: "Circuitul rocilor",
				children: [
					{ label: "Magmatică → sedimentară → metamorfică → magmă" },
					{ label: "Oricare tip se poate transforma în oricare altul" },
				],
			},
		],
	},

	"9:universul-partea-1": {
		label: "Universul",
		children: [
			{
				label: "Ce este Universul",
				children: [
					{ label: "Materie + energie + spațiu" },
					{ label: "Metagalaxia = Universul observabil" },
					{ label: "Big Bang (~13,8 miliarde de ani)" },
				],
			},
			{
				label: "Forțele fundamentale",
				children: [
					{ label: "Gravitațională" },
					{ label: "Electromagnetică" },
					{ label: "Nucleară tare" },
					{ label: "Nucleară slabă" },
				],
			},
			{
				label: "Unități de distanță",
				children: [
					{ label: "Unitatea astronomică" },
					{ label: "Anul-lumină" },
					{ label: "Parsecul și kiloparsecul" },
				],
			},
			{
				label: "Calea Lactee",
				children: [
					{ label: "Galaxie spirală (100–200 mld. stele)" },
					{ label: "Brațul Orion (Soarele)" },
					{ label: "Diametru ~100 000 ani-lumină" },
				],
			},
			{
				label: "Nebuloase și stele",
				children: [
					{ label: "Nebuloase — materie interstelară" },
					{ label: "Stelele se nasc din nebuloase" },
					{ label: "Alcătuite din H și He" },
					{ label: "Evoluția depinde de masă" },
				],
			},
			{
				label: "Constelațiile",
				children: [
					{ label: "Ursa Mare și Ursa Mică" },
					{ label: "Steaua Polară — orientare" },
				],
			},
		],
	},

	"9:universul-partea-2": {
		label: "Sistemul Solar",
		children: [
			{
				label: "Soarele",
				children: [
					{ label: "Stea medie, ~99% din masa sistemului" },
					{ label: "H (~71%) și He (~28%)" },
					{ label: "Structura (nucleu, fotosferă, coroană)" },
					{ label: "Ciclul de activitate de ~11 ani" },
				],
			},
			{
				label: "Formarea sistemului",
				children: [
					{ label: "Nebuloasă → protostea" },
					{ label: "Disc protoplanetar → planete" },
				],
			},
			{
				label: "Planetele",
				children: [
					{ label: "Telurice: Mercur, Venus, Terra, Marte" },
					{ label: "Giganți gazoși: Jupiter, Saturn, Uranus, Neptun" },
				],
			},
			{
				label: "Corpuri mici",
				children: [
					{ label: "Asteroizii (centura, Ceres)" },
					{ label: "Meteoriții („stele căzătoare”)" },
					{ label: "Cometele (nucleu, comă, coadă)" },
					{ label: "Centura Kuiper și Norul lui Oort" },
				],
			},
			{
				label: "Luna",
				children: [
					{ label: "Rotația = revoluția (aceeași față)" },
					{ label: "Geneza (impactul Theia)" },
					{ label: "Fazele Lunii și eclipsele" },
				],
			},
			{
				label: "Cucerirea spațiului",
				children: [
					{ label: "Gagarin (1961)" },
					{ label: "Armstrong pe Lună (1969)" },
					{ label: "Prunariu (1981)" },
				],
			},
		],
	},

	"9:zonele-biogeografice": {
		label: "Zonele biogeografice",
		children: [
			{
				label: "Lanțul cauzelor",
				children: [
					{ label: "Clima → vegetația → fauna" },
					{ label: "Zonalitate latitudinală" },
					{ label: "Etajare altitudinală (excepții azonale)" },
				],
			},
			{
				label: "Zona caldă",
				children: [
					{ label: "Pădurea ecuatorială" },
					{ label: "Savana" },
					{ label: "Pădurea musonică" },
					{ label: "Deșerturi tropicale" },
				],
			},
			{
				label: "Zonele temperate",
				children: [
					{ label: "Mediteraneană" },
					{ label: "Pădurea de foioase" },
					{ label: "Taiga (conifere)" },
					{ label: "Stepă, prerie, pampas" },
					{ label: "Deșerturi temperate" },
				],
			},
			{
				label: "Zonele reci",
				children: [
					{ label: "Tundra" },
					{ label: "Deșertul arctic" },
					{ label: "Deșertul antarctic" },
				],
			},
			{
				label: "De reținut",
				children: [
					{ label: "Fâșii paralele cu Ecuatorul" },
					{ label: "Biosfera = învelișul viu al Terrei" },
				],
			},
		],
	},

	"9:mediile-naturale-terestre": {
		label: "Mediile naturale terestre",
		children: [
			{
				label: "Ce este mediul geografic",
				children: [
					{ label: "Componente abiotice — roci, relief, aer, apă, sol" },
					{ label: "Componente biotice — plante, animale, microorganisme" },
					{ label: "Componente antropice — omul și activitățile lui" },
					{ label: "Ranguri: local → regional → zonal → global" },
				],
			},
			{
				label: "După intervenția omului",
				children: [
					{ label: "Mediul natural — ghețari, etaje alpine, deșerturi, păduri virgine, abisal" },
					{ label: "Mediul antropizat — natura încă domină (sate de munte, delte)" },
					{ label: "Mediul antropic — omul domină (oraș, industrie, agricultură)" },
				],
			},
			{
				label: "Mediile calde",
				children: [
					{ label: "Ecuatorial — cald și umed tot anul, pădure în 5 etaje, soluri laterite" },
					{ label: "Subecuatorial (savană) — două anotimpuri, ierburi înalte, soluri roșii" },
					{ label: "Tropical uscat — sub 200 mm/an, erguri, hamade, ueduri" },
					{ label: "Subtropical (mediteranean) — vară secetoasă, maquis, terra rossa" },
				],
			},
			{
				label: "Mediile temperate",
				children: [
					{ label: "Temperat-oceanic — veri răcoroase, ierni blânde, foioase" },
					{ label: "Stepă și silvostepă — cernoziomuri, zona cerealieră a globului" },
					{ label: "Temperat arid — Karakum, Gobi, Marele Bazin" },
					{ label: "Păduri de foioase — stejar, fag, carpen" },
					{ label: "Taiga — conifere, podzoluri, ierni aspre" },
				],
			},
			{
				label: "Mediile reci",
				children: [
					{ label: "Polar glaciar — calote, fielduri, kame, drumline" },
					{ label: "Subpolar (tundra) — permafrost, mușchi și licheni, ren caribu" },
				],
			},
			{
				label: "Mediile azonale",
				children: [
					{ label: "Montan — legea etajării: creste, tundră montană, păduri" },
					{ label: "Oaze în deșert; badlands („pământuri rele”)" },
				],
			},
			{
				label: "Mediile antropizate",
				children: [
					{ label: "Urban — sistem deschis, zone funcționale" },
					{ label: "Rural — sat liniar, compact, dispersat" },
				],
			},
			{
				label: "Mediile oceanice",
				children: [
					{ label: "Litoral — șelf, lumină, viață bogată" },
					{ label: "Pelagic — plancton până la ~200 m, delfini, balene" },
					{ label: "Abisal — fără lumină, presiune mare, adaptări extreme" },
				],
			},
			{
				label: "De reținut",
				children: [
					{ label: "Clima comandă: vegetația, fauna, solul, procesele reliefului" },
					{ label: "Zonalitate latitudinală vs. etajare altitudinală" },
				],
			},
		],
	},
};
