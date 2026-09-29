import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleRouting = createMiddleware(routing);

export function proxy(request: Parameters<typeof handleRouting>[0]) {
  return handleRouting(request);
}

export default handleRouting;

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
