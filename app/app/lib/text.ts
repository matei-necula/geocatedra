/** Diacritic- and case-insensitive fold (munți → munti, Relief → relief). */
export function fold(s: string): string {
	return s.normalize("NFD").replace(/[\u0300-\u036F]/g, "").toLowerCase();
}
