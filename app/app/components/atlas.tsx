/** Roman numeral for chapter numbering (1–3999). */
export function roman(n: number): string {
	const table: [number, string][] = [
		[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
		[50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
	];
	let out = "";
	for (const [v, s] of table) while (n >= v) { out += s; n -= v; }
	return out;
}

export function Kicker({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return <p className={`kicker text-lg ${className}`}>{children}</p>;
}

export function Plate({
	children,
	label,
	className = "",
}: {
	children: React.ReactNode;
	label?: string;
	className?: string;
}) {
	return (
		<div className={`plate paper ${className}`}>
			{label && <span className="plate-label">{label}</span>}
			{children}
		</div>
	);
}

export function StampCircle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return <div className={`stamp-circle ${className}`}>{children}</div>;
}

export function StampBadge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return <span className={`stamp-badge ${className}`}>{children}</span>;
}

export function DottedRow({
	left,
	right,
	className = "",
}: {
	left: React.ReactNode;
	right: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`flex items-end ${className}`}>
			<span>{left}</span>
			<span aria-hidden className="dotted-leader" />
			<span className="tabular-nums">{right}</span>
		</div>
	);
}
