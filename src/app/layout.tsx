import type { Metadata } from "next";
import { PropsWithChildren } from "react";

import { t } from "@/i18n/t";

import "./globals.css";

export const metadata: Metadata = {
  title: t("common.appName"),
  description: t("common.appDescription")
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
