import type { Config } from "@react-router/dev/config";

export default {
	ssr: true,
	future: {
		// Renamed from `unstable_viteEnvironmentApi` when it stabilized in react-router 7.18.
		v8_viteEnvironmentApi: true,
	},
} satisfies Config;
