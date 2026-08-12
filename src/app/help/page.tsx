import { getLang } from '@/lib/get-lang';

const SQ = [
  { q: 'Si të regjistrohem?', a: 'Klikoni "Hyr / Regjistrohu" në krye të faqes, plotësoni emrin, email-in dhe fjalëkalimin, dhe konfirmoni llogarinë përmes email-it që do t\'ju dërgojmë.' },
  { q: 'Si të postoj një shpallje?', a: 'Pasi të hyni në llogarinë tuaj, klikoni "+ Posto Shpallje", zgjidhni kategorinë, plotësoni detajet, shtoni foto dhe lokacionin (i detyrueshëm për pronat), dhe publikoni.' },
  { q: 'Sa kohë qëndron aktive një shpallje?', a: 'Çdo shpallje qëndron aktive për 29 ditë dhe më pas hiqet automatikisht. Mund ta ripostoni kur të doni.' },
  { q: 'Si të kontaktoj një shitës?', a: 'Në faqen e shpalljes, përdorni kutinë "Dërgo Mesazh Shitësit" — mesazhet ruhen në llogarinë tuaj nën "Mesazhet e Mia".' },
  { q: 'Si të raportoj një shpallje të dyshimtë?', a: 'Në faqen e shpalljes, klikoni "Raporto këtë shpallje" dhe zgjidhni arsyen. Ekipi ynë e shqyrton çdo raportim.' },
  { q: 'Si të fshij llogarinë time?', a: 'Na kontaktoni në email-in më poshtë dhe do ta fshijmë llogarinë dhe të dhënat tuaja sipas Politikës së Privatësisë.' },
];

const EN = [
  { q: 'How do I register?', a: 'Click "Log In / Register" at the top of the page, fill in your name, email and password, and confirm your account via the email we send you.' },
  { q: 'How do I post a listing?', a: 'Once logged in, click "+ Post Ad", choose a category, fill in the details, add photos and a location (required for real estate), and publish.' },
  { q: 'How long does a listing stay active?', a: 'Every listing stays active for 29 days and is then automatically removed. You can repost it anytime.' },
  { q: 'How do I contact a seller?', a: 'On the listing page, use the "Send a Message to the Seller" box — messages are saved to your account under "My Messages".' },
  { q: 'How do I report a suspicious listing?', a: 'On the listing page, click "Report this listing" and choose a reason. Our team reviews every report.' },
  { q: 'How do I delete my account?', a: 'Contact us at the email below and we\'ll delete your account and data in accordance with our Privacy Policy.' },
];

export default async function HelpPage() {
  const lang = await getLang();
  const faqs = lang === 'sq' ? SQ : EN;
  const title = lang === 'sq' ? 'Qendra e Ndihmës' : 'Help Center';
  const contactNote = lang === 'sq' ? 'Ende keni pyetje? Na shkruani:' : 'Still have questions? Email us:';

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-2xl border border-glass-border bg-surface p-7">
        <h1 className="mb-5 text-2xl font-extrabold">{title}</h1>
        <div className="space-y-5">
          {faqs.map((item, i) => (
            <div key={i}>
              <h2 className="mb-1 text-base font-bold">{item.q}</h2>
              <p className="text-sm leading-relaxed text-[#cbc6ba]">{item.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 border-t border-glass-border pt-4 text-sm text-muted">
          {contactNote} <span className="font-semibold text-white">info@shesblejks.com</span>
        </p>
      </div>
    </main>
  );
}
