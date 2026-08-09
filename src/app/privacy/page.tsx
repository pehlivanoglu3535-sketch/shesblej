import { getLang } from '@/lib/get-lang';

const SQ = `
## Politika e Privatësisë

**Përditësuar së fundmi:** ${new Date().toISOString().slice(0, 10)}

### 1. Cilat të dhëna mbledhim
Kur regjistroheni, mbledhim: emrin, email-in, numrin e telefonit, numrin e ID-së, datëlindjen, dhe llojin e llogarisë (individuale/biznes). Kur postoni një shpallje, mbledhim detajet e shpalljes dhe fotot që ngarkoni. Kur dërgoni mesazhe, ruajmë përmbajtjen e mesazheve mes jush dhe përdoruesve të tjerë.

### 2. Pse mbledhim numrin e ID-së dhe datëlindjen
Këto të dhëna mblidhen me pëlqimin tuaj eksplicit gjatë regjistrimit, me qëllim identifikimin e përdoruesve në rast dyshimi për mashtrim ose keqpërdorim të platformës. Ato **nuk shfaqen publikisht** dhe nuk u shiten palëve të treta. Vetëm administratorët e platformës kanë qasje në to, dhe vetëm për hetimin e rasteve të raportuara.

### 3. Si i ruajmë të dhënat
Të dhënat ruhen në një bazë të dhënash të sigurt (Supabase/PostgreSQL) me kontrolle qasjeje në nivel rreshti (Row Level Security) — çdo përdorues sheh vetëm të dhënat e veta, përveç administratorëve për qëllime hetimi.

### 4. Me kë i ndajmë të dhënat
Nuk i shesim as nuk i ndajmë të dhënat tuaja personale me palë të treta për qëllime marketingu. Ofruesi ynë i infrastrukturës (Supabase) përpunon të dhënat në emrin tonë sipas kushteve të tyre të përpunimit të të dhënave.

### 5. Të drejtat tuaja
Keni të drejtë të kërkoni qasje, korrigjim, ose fshirje të të dhënave tuaja personale. Për ta bërë këtë, na kontaktoni përmes platformës ose fshini llogarinë tuaj drejtpërdrejt.

### 6. Ruajtja e të dhënave
Të dhënat e llogarisë ruhen për sa kohë llogaria juaj është aktive. Shpalljet fshihen automatikisht 29 ditë pas postimit nëse nuk rinovohen.

### 7. Cookies
Përdorim cookies thelbësore për mirëmbajtjen e sesionit tuaj të kyçjes. Nuk përdorim cookies gjurmuese për reklama.

### 8. Siguria
Fjalëkalimet ruhen të enkriptuara (hash-uara). Përdorim lidhje HTTPS për të gjitha komunikimet.

### 9. Fëmijët
Platforma nuk synohet për persona nën 18 vjeç.

### 10. Ndryshimet në këtë politikë
Mund ta përditësojmë këtë politikë herë pas here. Ndryshimet e rëndësishme do të komunikohen përmes platformës.

### 11. Kontakti
Për pyetje rreth privatësisë ose për të ushtruar të drejtat tuaja, na kontaktoni përmes platformës.
`;

const EN = `
## Privacy Policy

**Last updated:** ${new Date().toISOString().slice(0, 10)}

### 1. What data we collect
When you register, we collect: your name, email, phone number, ID number, date of birth, and account type (individual/business). When you post a listing, we collect the listing details and photos you upload. When you send messages, we store the content of messages between you and other users.

### 2. Why we collect your ID number and date of birth
This data is collected with your explicit consent during registration, for the purpose of identifying users in case of suspected fraud or platform misuse. It is **never displayed publicly** and is not sold to third parties. Only platform administrators have access to it, and only for investigating reported cases.

### 3. How we store data
Data is stored in a secure database (Supabase/PostgreSQL) with row-level access controls — each user only sees their own data, except administrators for investigation purposes.

### 4. Who we share data with
We do not sell or share your personal data with third parties for marketing purposes. Our infrastructure provider (Supabase) processes data on our behalf under their data processing terms.

### 5. Your rights
You have the right to request access to, correction of, or deletion of your personal data. To do so, contact us through the platform or delete your account directly.

### 6. Data retention
Account data is retained for as long as your account is active. Listings are automatically deleted 29 days after posting if not renewed.

### 7. Cookies
We use essential cookies to maintain your login session. We do not use tracking cookies for advertising.

### 8. Security
Passwords are stored encrypted (hashed). We use HTTPS connections for all communications.

### 9. Children
The Platform is not intended for individuals under 18 years of age.

### 10. Changes to this policy
We may update this policy from time to time. Significant changes will be communicated through the platform.

### 11. Contact
For privacy questions or to exercise your rights, please contact us through the platform.
`;

function renderMarkdownLite(text: string) {
  return text
    .trim()
    .split('\n\n')
    .map((block, i) => {
      if (block.startsWith('## ')) {
        return (
          <h1 key={i} className="mb-4 text-2xl font-extrabold">
            {block.replace('## ', '')}
          </h1>
        );
      }
      if (block.startsWith('### ')) {
        return (
          <h2 key={i} className="mt-6 mb-2 text-lg font-bold">
            {block.replace('### ', '')}
          </h2>
        );
      }
      if (block.startsWith('**')) {
        return (
          <p key={i} className="mb-2 text-sm text-muted">
            {block.replace(/\*\*/g, '')}
          </p>
        );
      }
      return (
        <p key={i} className="mb-2 text-sm leading-relaxed text-[#cbc6ba]">
          {block.split('**').map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
        </p>
      );
    });
}

export default async function PrivacyPage() {
  const lang = await getLang();
  const content = lang === 'sq' ? SQ : EN;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-2xl border border-glass-border bg-surface p-7">{renderMarkdownLite(content)}</div>
    </main>
  );
}
