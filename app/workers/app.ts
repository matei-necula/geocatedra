import { createRequestHandler } from "react-router";
import { withSecurityHeaders } from "../app/lib/headers";
import { warnMissingLimiters } from "../app/lib/ratelimit";
import { BUILD_SITE_MODE, parseSiteMode } from "../app/lib/site-mode";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	async fetch(request, env, ctx) {
		// Modul din bundle și cel din bindinguri trebuie să coincidă. Dacă nu coincid, nu
		// servim nimic: o instanță pe jumătate liberă e mai periculoasă decât una căzută.
		if (BUILD_SITE_MODE !== parseSiteMode(env.SITE_MODE)) {
			console.error(
				`SITE_MODE mismatch: build=${BUILD_SITE_MODE} env=${env.SITE_MODE ?? "(lipsă)"} — deploy încrucișat`,
			);
			return new Response("Configurare greșită", { status: 500 });
		}

		// One line per isolate if a rate-limit binding is missing. underLimit fails open, so without
		// this a misconfigured limiter is indistinguishable from a working one.
		warnMissingLimiters(env);
		const response = await requestHandler(request, {
			cloudflare: { env, ctx },
		});
		return withSecurityHeaders(request, response);
	},
} satisfies ExportedHandler<Env>;
