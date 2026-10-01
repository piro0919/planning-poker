import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // api・Next の内部・Vercel の内部と、拡張子を持つ静的ファイルは通さない。
  // ここで拾うと、言語の付いた道筋として扱われて 404 になる。
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
