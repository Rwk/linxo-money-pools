"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClassName } from "@/components/ui/button";
import { t } from "@/i18n/t";

export function SiteNavigation({
  signedIn,
  accountAction
}: {
  signedIn: boolean;
  accountAction?: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link
          className="site-brand"
          href="/"
          aria-label={t("navigation.homeLabel")}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            aria-hidden="true"
            focusable="false"
          >
            <rect
              x="3"
              y="10"
              width="26"
              height="19"
              rx="6"
              fill="var(--accent)"
            />
            <path
              d="M4 16h24M16 10v19"
              stroke="var(--surface)"
              strokeWidth="2"
            />
            <path
              d="M16 10c-8 0-10-6-6-7 4-1 6 7 6 7Zm0 0c8 0 10-6 6-7-4-1-6 7-6 7Z"
              fill="var(--celebration)"
            />
          </svg>
          {t("common.appName")}
        </Link>
        <nav className="site-nav" aria-label={t("navigation.primary")}>
          {signedIn ? (
            <>
              <Link
                className="site-nav-link"
                href="/dashboard"
                aria-current={
                  pathname === "/dashboard" ||
                  (pathname?.startsWith("/dashboard/pools/") &&
                    pathname !== "/dashboard/pools/new")
                    ? "page"
                    : undefined
                }
              >
                {t("dashboard.title")}
              </Link>
              <Link
                className={buttonClassName()}
                href="/dashboard/pools/new"
                aria-current={
                  pathname === "/dashboard/pools/new" ? "page" : undefined
                }
              >
                {t("dashboard.createPool")}
              </Link>
              <div
                className="site-account"
                role="group"
                aria-label={t("navigation.account")}
              >
                {accountAction}
              </div>
            </>
          ) : pathname !== "/sign-in" ? (
            <Link className="site-nav-link" href="/sign-in">
              {t("common.signIn")}
            </Link>
          ) : null}
          {/* FAQ joins this navigation in DESIGN-2 when its content route exists. */}
        </nav>
      </div>
    </header>
  );
}
