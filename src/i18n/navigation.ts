import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// 言語の接頭辞を自分で足さずに済むよう、next/navigation の代わりにこちらを使う。
export const { Link, getPathname, redirect, usePathname, useRouter } =
  createNavigation(routing);
