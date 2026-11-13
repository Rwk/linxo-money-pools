import Link from "next/link";
import { auth } from "@/auth";
import { isLinxoEmail } from "@/auth/linxo-email-domain";
import { buttonClassName } from "@/components/ui/button";
import { OccasionIllustration } from "@/components/illustrations/occasion-illustration";
import { t } from "@/i18n/t";

const steps = ["create", "share", "follow"] as const;

export default async function HomePage() {
  const session = await auth();
  const signedIn = Boolean(
    session?.user?.id && isLinxoEmail(session.user.email)
  );

  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="home-eyebrow">{t("home.eyebrow")}</p>
          <h1 id="home-title">
            {t("home.title")} <span>{t("home.titleAccent")}</span>
          </h1>
          <p className="home-intro">{t("home.body")}</p>
          <Link
            className={buttonClassName()}
            href={signedIn ? "/dashboard/pools/new" : "/sign-in"}
          >
            {t(signedIn ? "dashboard.createPool" : "common.signIn")}
            <span aria-hidden="true">↗</span>
          </Link>
          <p className="home-access-note">
            {t(signedIn ? "home.signedInNote" : "home.accessNote")}
          </p>
        </div>
        <OccasionIllustration />
      </section>

      <section className="home-how" aria-labelledby="home-how-title">
        <h2 className="ui-section-title" id="home-how-title">
          {t("home.stepsTitle")}
        </h2>
        <ol className="home-steps">
          {steps.map((step, index) => (
            <li key={step}>
              <span className="home-step-number" aria-hidden="true">
                0{index + 1}
              </span>
              <div>
                <h3>{t(`home.steps.${step}.title`)}</h3>
                <p>{t(`home.steps.${step}.body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-help" aria-labelledby="home-help-title">
        <div>
          <h2 className="ui-section-title" id="home-help-title">
            {t("home.helpTitle")}
          </h2>
          <p>{t("home.helpBody")}</p>
        </div>
        <Link className="site-nav-link" href="/faq">
          {t("home.faqLink")} <span aria-hidden="true">&nbsp;→</span>
        </Link>
      </section>
    </main>
  );
}
