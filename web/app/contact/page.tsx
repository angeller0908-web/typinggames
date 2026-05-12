import { SITE } from "@/lib/site";

export const metadata = {
  title: "Contact",
  description: "Get in touch — feedback, bug reports, business enquiries.",
};

export default function ContactPage() {
  return (
    <article className="py-10 max-w-2xl">
      <h1 className="text-3xl font-extrabold mb-4">Contact {SITE.name}</h1>
      <p className="text-ink/80 leading-relaxed mb-6">
        We read every message. We don't always reply individually, but feedback genuinely shapes
        what we build next. Please use the channel that best matches your reason for reaching out.
      </p>
      <div className="space-y-5">
        <div className="bg-white ring-1 ring-ink/10 rounded-lg p-5">
          <h2 className="font-bold mb-1">Feedback on a specific game</h2>
          <p className="text-sm text-ink/70">
            Email <a className="text-accent underline" href="mailto:hello@typingrally.com">hello@typingrally.com</a> with the game name in the subject line.
          </p>
        </div>
        <div className="bg-white ring-1 ring-ink/10 rounded-lg p-5">
          <h2 className="font-bold mb-1">Bug reports</h2>
          <p className="text-sm text-ink/70">
            Include your browser (Chrome, Firefox, Safari) and OS version. Paste any error from
            the browser console if you can. Send to{" "}
            <a className="text-accent underline" href="mailto:bugs@typingrally.com">
              bugs@typingrally.com
            </a>
            .
          </p>
        </div>
        <div className="bg-white ring-1 ring-ink/10 rounded-lg p-5">
          <h2 className="font-bold mb-1">Business / partnerships</h2>
          <p className="text-sm text-ink/70">
            For ad partnerships, sponsorships, or licensing the engine,{" "}
            <a className="text-accent underline" href="mailto:business@typingrally.com">
              business@typingrally.com
            </a>
            .
          </p>
        </div>
        <div className="bg-white ring-1 ring-ink/10 rounded-lg p-5">
          <h2 className="font-bold mb-1">Privacy / legal / DMCA</h2>
          <p className="text-sm text-ink/70">
            Privacy or legal:{" "}
            <a className="text-accent underline" href="mailto:legal@typingrally.com">
              legal@typingrally.com
            </a>
            . DMCA takedowns must include the items listed on the{" "}
            <a className="text-accent underline" href="/dmca">DMCA page</a>.
          </p>
        </div>
      </div>
    </article>
  );
}
