"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
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
  const menuId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const nav = useRef<HTMLElement>(null);
  const [openedPath, setOpenedPath] = useState<string | null>(null);
  const open = openedPath !== null && openedPath === (pathname ?? "");
  // Discard an open disclosure on navigation, including Back/Forward revisits.
  if (openedPath !== null && openedPath !== (pathname ?? ""))
    setOpenedPath(null);

  useEffect(() => {
    if (!open) return;
    nav.current?.querySelector<HTMLElement>("a, button")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpenedPath(null);
        trigger.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (!header.current?.contains(event.target as Node)) setOpenedPath(null);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const desktop = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      setOpenedPath(null);
      if (!desktop.matches && nav.current?.contains(document.activeElement))
        trigger.current?.focus();
      else if (desktop.matches && document.activeElement === trigger.current)
        nav.current?.querySelector<HTMLElement>("a, button")?.focus();
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);
  return (
    <header
      className="site-header"
      ref={header}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setOpenedPath(null);
      }}
    >
      <div className="site-header-inner">
        <Link
          className="site-brand"
          onClick={() => setOpenedPath(null)}
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
          <span>{t("common.appName")}</span>
        </Link>
        <button
          className="site-menu-trigger"
          type="button"
          ref={trigger}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={t(open ? "navigation.closeMenu" : "navigation.openMenu")}
          onClick={() => setOpenedPath(open ? null : (pathname ?? ""))}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d={open ? "m5 5 10 10M15 5 5 15" : "M3 5h14M3 10h14M3 15h14"}
            />
          </svg>
          {t("navigation.menu")}
        </button>
        <nav
          className="site-nav"
          id={menuId}
          ref={nav}
          data-open={open}
          aria-label={t("navigation.primary")}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) {
              setOpenedPath(null);
              trigger.current?.focus();
            }
          }}
          onSubmit={() => {
            setOpenedPath(null);
            trigger.current?.focus();
          }}
        >
          {!signedIn ? (
            <Link className="site-nav-link site-mobile-home" href="/">
              {t("navigation.home")}
            </Link>
          ) : null}
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
          <Link
            className="site-nav-link"
            href="/faq"
            aria-current={pathname === "/faq" ? "page" : undefined}
          >
            {t("navigation.faq")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
