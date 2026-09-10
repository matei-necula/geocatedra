import { useEffect } from "react";
import { resizeImageFile } from "../../../lib/imageResize";

export type ImgRef =
	| { kind: "file"; file: File; previewUrl: string }
	| { kind: "asset"; assetId: string; previewUrl: string };

const inputCls =
	"rounded-lg border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "grid gap-1.5 text-sm";

interface Props {
	value: ImgRef | null;
	onChange: (v: ImgRef | null) => void;
	reusable: { assetId: string; title: string }[];
	label: string;
}

export function ImagePicker({ value, onChange, reusable, label }: Props) {
	// Revoke the blob URL we created for a "file" value once it is replaced
	// or the component unmounts. The cleanup closes over this render's
	// `value`, so it fires with the *previous* value right before the next
	// effect runs (on replace) or on unmount — and it only ever revokes
	// blob URLs we created (kind "file"), never /media/... asset URLs.
	useEffect(() => {
		return () => {
			if (value?.kind === "file") {
				URL.revokeObjectURL(value.previewUrl);
			}
		};
	}, [value]);

	async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		const resized = await resizeImageFile(file);
		onChange({ kind: "file", file: resized, previewUrl: URL.createObjectURL(resized) });
	}

	function handleReuseChange(e: React.ChangeEvent<HTMLSelectElement>) {
		const assetId = e.target.value;
		if (!assetId) return;
		onChange({ kind: "asset", assetId, previewUrl: "/media/" + assetId });
	}

	return (
		<div className={labelCls}>
			<span>{label}</span>
			{value ? (
				<div className="flex items-center gap-3">
					<img
						src={value.previewUrl}
						alt=""
						className="h-20 w-20 rounded-lg border border-border object-cover"
					/>
					<button
						type="button"
						onClick={() => onChange(null)}
						className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-bg-alt"
					>
						Elimină
					</button>
				</div>
			) : (
				<div className="grid gap-2 rounded-lg border border-dashed border-border p-3 text-sm">
					<span className="text-muted">Adaugă imagine</span>
					<input type="file" accept="image/*" onChange={handleFileChange} className={inputCls} />
					{reusable.length > 0 && (
						<label className="grid gap-1.5">
							<span className="text-muted">Sau refolosește o imagine dintr-un joc</span>
							<select defaultValue="" onChange={handleReuseChange} className={inputCls}>
								<option value="" disabled>
									Alege o imagine…
								</option>
								{reusable.map((r) => (
									<option key={r.assetId} value={r.assetId}>
										{r.title}
									</option>
								))}
							</select>
						</label>
					)}
				</div>
			)}
		</div>
	);
}
