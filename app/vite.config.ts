import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Un singur comutator pentru amândouă instanțele. `CLOUDFLARE_ENV` e citit oricum de
// @cloudflare/vite-plugin ca să aleagă environmentul din wrangler.json (numele Workerului
// și bindingurile). Îl citim aici din nou ca să injectăm același mod în cod, deci build-ul,
// Workerul și bindingurile nu pot ajunge niciodată în dezacord.
const siteMode = process.env.CLOUDFLARE_ENV === "liber" ? "liber" : "clase";

export default defineConfig({
	define: {
		__SITE_MODE__: JSON.stringify(siteMode),
	},
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
	],
});
