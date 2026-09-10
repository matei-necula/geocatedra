import { useNavigation } from "react-router";

/** Thin indeterminate progress bar shown during navigations/submissions. */
export function TopProgress() {
	const nav = useNavigation();
	const active = nav.state !== "idle";
	return (
		<div
			aria-hidden
			className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
		>
			<div
				className="h-full w-2/5 rounded-full bg-primary"
				style={active ? { animation: "cat-progress 1.1s ease-in-out infinite" } : undefined}
			/>
		</div>
	);
}
