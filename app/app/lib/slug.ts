const RO: Record<string, string> = {
	ă: "a", â: "a", î: "i", ș: "s", ş: "s", ț: "t", ţ: "t",
	Ă: "a", Â: "a", Î: "i", Ș: "s", Ş: "s", Ț: "t", Ţ: "t",
};

export function slugify(input: string): string {
	const replaced = input.replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, (c) => RO[c] ?? c);
	return replaced
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60) || "material";
}
