import type { Metadata } from "next";
import { t } from "@/i18n/t";

export const metadata: Metadata = { title: `FAQ — ${t("common.appName")}` };
const sections = [
  {
    id: "start",
    title: "faq.startTitle",
    questions: ["who", "create", "account"]
  },
  {
    id: "payments",
    title: "faq.paymentsTitle",
    questions: ["pay", "methods", "return", "pending", "fixed"]
  },
  {
    id: "privacy",
    title: "faq.privacyTitle",
    questions: ["amount", "name", "owner"]
  },
  {
    id: "management",
    title: "faq.managementTitle",
    questions: ["reuse", "date", "reopen", "archive"]
  },
  {
    id: "responsibilities",
    title: "faq.responsibilitiesTitle",
    questions: ["funds", "bankDetails", "linxo", "responsibility"]
  }
] as const;

export default function FaqPage() {
  return (
    <main className="faq-page">
      <header className="faq-heading">
        <p className="home-eyebrow">{t("navigation.faq")}</p>
        <h1 className="ui-page-title">{t("faq.title")}</h1>
        <p>{t("faq.body")}</p>
      </header>
      <div className="faq-layout">
        <nav className="faq-topics" aria-label={t("faq.topics")}>
          {sections.map((section) => (
            <a key={section.id} href={`#faq-${section.id}`}>
              {t(section.title)}
            </a>
          ))}
        </nav>
        <div className="faq-sections">
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={`faq-${section.id}`}>
              <h2 className="ui-section-title" id={`faq-${section.id}`}>
                {t(section.title)}
              </h2>
              {section.questions.map((question) => (
                <details key={question} className="faq-item">
                  <summary>
                    {t(`faq.questions.${question}.question`)}
                    <svg
                      className="faq-toggle"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M3 9h12" />
                      <path className="faq-toggle-vertical" d="M9 3v12" />
                    </svg>
                  </summary>
                  <p>{t(`faq.questions.${question}.answer`)}</p>
                </details>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
