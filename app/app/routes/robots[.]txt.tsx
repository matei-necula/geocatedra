import type { Route } from "./+types/robots[.]txt";
import { robotsTxt } from "../lib/sitemap";

// A route, not a static public/robots.txt file: the production domain isn't bought yet, and the
// Sitemap: line needs the real origin. Deriving it from the request keeps this domain-agnostic
// (per CLAUDE.md — never hardcode a domain) instead of shipping a placeholder that'd need editing
// by hand the day the domain is finally live.
export async function loader({ request }: Route.LoaderArgs) {
	const { origin, hostname } = new URL(request.url);

	return new Response(robotsTxt(origin, hostname), {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
