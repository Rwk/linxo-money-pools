import type { Metadata } from "next";
import { PropsWithChildren } from "react";

import { SiteHeader } from "@/components/navigation/site-header";
import { t } from "@/i18n/t";

import "./globals.css";

export const metadata: Metadata = {
  title: t("common.appName"),
  description: t("common.appDescription")
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <body>
        <a className="skip-link" href="#main-content">
          {t("navigation.skipToContent")}
        </a>
        <SiteHeader />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
      </body>
    </html>
  );
}
