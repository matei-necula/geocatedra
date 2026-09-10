import { FullscreenButton, Lightbox, useLightbox } from "./Lightbox";

export interface AssetLite {
	id: string;
	role: string;
	mime: string;
	idx?: number;
}

/** Full-size render of a single asset, by role. `viewOnly` hides download affordances. */
export function AssetView({ asset, viewOnly = false }: { asset: AssetLite; viewOnly?: boolean }) {
	const href = `/media/${asset.id}`;
	const lightbox = useLightbox();
	if (asset.role === "video") {
		return <video controls controlsList={viewOnly ? "nodownload" : undefined} preload="metadata" className="w-full rounded-xl border border-border" src={href} />;
	}
	if (asset.role === "image") {
		return (
			<>
				<div className="cat-img-frame group relative overflow-hidden rounded-xl border border-border">
					<img
						src={href}
						alt=""
						draggable={false}
						onContextMenu={(e) => e.preventDefault()}
						onClick={() => lightbox.open(0)}
						className="w-full cursor-zoom-in"
						loading="lazy"
					/>
					<FullscreenButton onClick={() => lightbox.open(0)} className="absolute right-2 bottom-2" />
				</div>
				{lightbox.openIndex !== null && (
					<Lightbox
						images={[{ id: asset.id }]}
						index={lightbox.openIndex}
						onIndexChange={lightbox.setIndex}
						onClose={lightbox.close}
					/>
				)}
			</>
		);
	}
	if (asset.role === "pdf") {
		return (
			<div>
				<iframe src={`${href}#toolbar=0`} title="PDF" className="h-[70vh] w-full rounded-xl border border-border" />
				{!viewOnly && (
					<a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-primary">
						Deschide PDF în filă nouă →
					</a>
				)}
			</div>
		);
	}
	if (viewOnly) {
		return <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">Fișier disponibil doar pentru vizualizare (descărcarea este dezactivată).</p>;
	}
	return (
		<a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 font-medium text-primary transition hover:border-primary">
			⬇ Descarcă fișierul
		</a>
	);
}

export function ImageGallery({ assets }: { assets: AssetLite[]; viewOnly?: boolean }) {
	const images = assets.filter((a) => a.role === "image");
	const lightbox = useLightbox();
	if (images.length === 0) {
		return (
			<div className="grid aspect-[3/2] place-items-center rounded-xl bg-gradient-to-br from-sand via-accent to-primary text-5xl text-white/80">
				◑
			</div>
		);
	}
	return (
		<div className={`grid gap-3 ${images.length > 1 ? "sm:grid-cols-2" : ""}`}>
			{images.map((a, i) => (
				<div key={a.id} className="cat-img-frame group relative overflow-hidden rounded-xl border border-border">
					<img
						src={`/media/${a.id}`}
						alt=""
						draggable={false}
						onContextMenu={(e) => e.preventDefault()}
						onClick={() => lightbox.open(i)}
						className="w-full cursor-zoom-in object-cover"
						loading="lazy"
					/>
					<FullscreenButton onClick={() => lightbox.open(i)} className="absolute right-2 bottom-2" />
				</div>
			))}
			{lightbox.openIndex !== null && (
				<Lightbox
					images={images.map((a) => ({ id: a.id }))}
					index={lightbox.openIndex}
					onIndexChange={lightbox.setIndex}
					onClose={lightbox.close}
				/>
			)}
		</div>
	);
}

/** Compact "attached files" block shown under non-photo / non-file materials. */
export function Attachments({ assets, viewOnly = false }: { assets: AssetLite[]; viewOnly?: boolean }) {
	if (assets.length === 0) return null;
	const images = assets.filter((a) => a.role === "image");
	const videos = assets.filter((a) => a.role === "video");
	const pdfs = assets.filter((a) => a.role === "pdf");
	const files = assets.filter((a) => a.role === "file");
	const lightbox = useLightbox();
	return (
		<div className="mt-6">
			<h3 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">Fișiere atașate</h3>
			{images.length > 0 && (
				<div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
					{images.map((a, i) => (
						<div key={a.id} className="cat-img-frame group relative overflow-hidden rounded-lg border border-border">
							<img
								src={`/media/${a.id}`}
								alt=""
								draggable={false}
								onContextMenu={(e) => e.preventDefault()}
								onClick={() => lightbox.open(i)}
								className="aspect-[3/2] w-full cursor-zoom-in object-cover"
								loading="lazy"
							/>
							<FullscreenButton onClick={() => lightbox.open(i)} className="absolute right-1 bottom-1 h-8 w-8" />
						</div>
					))}
				</div>
			)}
			{images.length > 0 && lightbox.openIndex !== null && (
				<Lightbox
					images={images.map((a) => ({ id: a.id }))}
					index={lightbox.openIndex}
					onIndexChange={lightbox.setIndex}
					onClose={lightbox.close}
				/>
			)}
			{videos.map((a) => (
				<video key={a.id} controls controlsList={viewOnly ? "nodownload" : undefined} preload="metadata" className="mb-3 w-full rounded-lg border border-border" src={`/media/${a.id}`} />
			))}
			{viewOnly ? (
				(pdfs.length > 0 || files.length > 0) && (
					<p className="text-sm text-muted">{pdfs.length + files.length} fișier(e) — doar vizualizare.</p>
				)
			) : (
				<div className="flex flex-wrap gap-2">
					{pdfs.map((a) => (
						<a key={a.id} href={`/media/${a.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-primary transition hover:border-primary">
							📄 Deschide PDF
						</a>
					))}
					{files.map((a) => (
						<a key={a.id} href={`/media/${a.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-primary transition hover:border-primary">
							⬇ Descarcă fișierul
						</a>
					))}
				</div>
			)}
		</div>
	);
}
