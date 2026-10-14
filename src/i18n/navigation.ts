import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// 言語の接頭辞を自分で足さずに済むよう、next/navigation の代わりにこちらを使う。
// 使うものだけを取り出す。Link や redirect が要るようになったら、ここに足す。
export const { usePathname, useRouter } = createNavigation(routing);
