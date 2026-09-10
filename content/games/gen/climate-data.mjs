// Sursa unică de adevăr pentru datele climatice ale proiectului: temperaturi
// medii lunare (°C) și precipitații medii lunare (mm), ianuarie → decembrie.
// Folosite de:
//   • content/games/gen/climograms.mjs  — climogramele SVG din jocul „Așază
//     climogramele pe hartă" (capitolul Climatele Terrei)
//   • app/scripts/draw-climograms.mjs   — graficele din panourile de vegetație
//     ale galeriei „Zonele biogeografice"
// Date proprii (CC0), pe tiparul normalelor publicate pentru o stație
// reprezentativă a fiecărei zone (stația e trecută în `ref`).
export const ZONES = {
	ecuatorial:              { title: "Climat ecuatorial",              ref: "Iquitos",    t: [26,26,27,27,27,26,26,26,26,26,26,26],              p: [200,192,208,216,208,144,120,112,136,176,192,184] },
	subecuatorial:           { title: "Climat subecuatorial",           ref: "Veracruz",   t: [25,28,31,33,32,29,27,26,27,29,28,25],              p: [0,0,3,15,55,140,220,300,200,60,5,0] },
	"tropical-uscat":        { title: "Climat tropical-uscat",          ref: "Kalgoorlie", t: [12,15,19,25,29,33,35,34,31,25,18,13],              p: [3,2,2,1,1,0,0,0,0,1,2,3] },
	musonic:                 { title: "Climat musonic",                 ref: "Bangkok",    t: [24,25,27,29,30,29,27,27,27,28,27,25],              p: [2,1,0,1,15,520,700,440,300,90,15,4] },
	mediteranean:            { title: "Climat mediteranean",            ref: "Atena",      t: [9,10,12,16,21,26,28,28,24,19,14,11],               p: [60,50,45,30,20,8,5,7,15,50,70,70] },
	"subtropical-umed":      { title: "Climat subtropical umed",        ref: "Taipei",     t: [16,16,18,22,25,28,30,29,27,24,21,17],              p: [85,140,175,175,235,320,245,305,265,150,85,75] },
	"temperat-oceanic":      { title: "Climat temperat-oceanic",        ref: "Londra",     t: [5,5,7,9,13,16,18,17,15,11,8,6],                    p: [55,40,42,45,50,45,45,50,50,70,65,60] },
	"temperat-continental":  { title: "Climat temperat-continental",    ref: "Moscova",    t: [-5,-4,1,9,16,19,21,20,14,8,2,-3],                  p: [35,30,35,40,50,70,70,55,45,35,45,40] },
	stepa:                   { title: "Climat de stepă (semiarid)",     ref: "Aktiubinsk", t: [-13,-13,-6,7,16,21,23,21,14,6,-3,-10],             p: [20,17,20,22,32,30,32,20,20,25,27,25] },
	"pustiu-rece":           { title: "Climat de pustiu rece",          ref: "Ulaanbaatar",t: [-22,-17,-6,4,12,17,19,17,10,1,-11,-19],            p: [1,2,3,6,15,40,60,50,20,6,4,2] },
	taiga:                   { title: "Climat temperat-rece (taiga)",   ref: "Iakutsk",    t: [-40,-34,-20,-5,8,16,19,15,6,-8,-28,-38],           p: [8,6,5,7,16,31,44,38,17,11,10,10] },
	subpolar:                { title: "Climat subpolar",                ref: "Inuvik",     t: [-30,-25,-15,-5,5,12,15,11,4,-8,-22,-28],           p: [10,8,8,10,20,35,40,35,25,20,15,12] },
	polar:                   { title: "Climat polar",                   ref: "McMurdo",    t: [-28,-30,-28,-20,-10,-3,-1,-3,-10,-18,-24,-27],    p: [5,4,4,5,8,10,12,10,8,7,5,5] },
};
