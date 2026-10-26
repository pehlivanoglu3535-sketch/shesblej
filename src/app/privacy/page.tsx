import { getLang } from '@/lib/get-lang';
import { renderMarkdownLite } from '@/lib/markdown-lite';

const SQ = `
## Politika e Privatësisë

**Përditësuar së fundmi:** ${new Date().toISOString().slice(0, 10)}

### 1. Cilat të dhëna mbledhim
Kjo politikë vlen si për faqen shesblejks.com ashtu edhe për aplikacionin celular ShesBlej.

Kur regjistroheni, mbledhim: emrin, email-in, numrin e telefonit dhe llojin e llogarisë (individuale/biznes, me emrin e kompanisë nëse zgjidhni biznes). Kur postoni një shpallje, mbledhim detajet e shpalljes dhe fotot që ngarkoni. Kur dërgoni mesazhe, ruajmë përmbajtjen e mesazheve mes jush dhe përdoruesve të tjerë.

Në aplikacionin celular mbledhim gjithashtu:

- **Lokacionin e saktë** — vetëm kur shënoni në hartë vendndodhjen e një shpalljeje prone, dhe vetëm pasi jepni lejen. Ruhet si pjesë e shpalljes, jo si gjurmë lëvizjeje.
- **Fotografitë** që zgjidhni ose bëni me kamerë, vetëm ato që i bashkëngjitni një shpalljeje.
- **Një identifikues njoftimesh të pajisjes** (token-i i njoftimeve push), vetëm nëse i aktivizoni njoftimet, për t'ju lajmëruar kur merrni mesazh.

### 2. Çfarë NUK mbledhim
Nuk mbledhim numrin e letërnjoftimit, datëlindjen, të dhëna pagese, kontaktet tuaja, as historikun e shfletimit. Nuk përdorim gjurmues reklamash dhe nuk ndërtojmë profile reklamimi.

### 3. Si i ruajmë të dhënat
Të dhënat ruhen në një bazë të dhënash të sigurt (Supabase/PostgreSQL) me kontrolle qasjeje në nivel rreshti (Row Level Security) — çdo përdorues sheh vetëm të dhënat e veta, përveç administratorëve për qëllime hetimi.

### 4. Me kë i ndajmë të dhënat
Nuk i shesim as nuk i ndajmë të dhënat tuaja personale me palë të treta për qëllime marketingu. Ofruesi ynë i infrastrukturës (Supabase) përpunon të dhënat në emrin tonë sipas kushteve të tyre të përpunimit të të dhënave.

### 5. Të drejtat tuaja dhe fshirja e llogarisë
Keni të drejtë të kërkoni qasje, korrigjim ose fshirje të të dhënave tuaja personale.

Llogarinë mund ta fshini vetë në çdo kohë:

- **Në aplikacion:** Profili → Fshi llogarinë.
- **Në ueb:** përmes faqes [shesblejks.com/account-deletion](https://shesblejks.com/account-deletion), ose duke na shkruar në info@shesblejks.com.

Fshirja heq përgjithmonë llogarinë, shpalljet tuaja dhe fotot e tyre. Mesazhet që u keni dërguar të tjerëve mund të mbeten te marrësi, njësoj si një mesazh i dërguar.

### 6. Ruajtja e të dhënave
Të dhënat e llogarisë ruhen për sa kohë llogaria juaj është aktive. Shpalljet skadojnë automatikisht 29 ditë pas postimit nëse nuk rinovohen. Pas fshirjes së llogarisë, të dhënat hiqen nga sistemet tona brenda 30 ditëve.

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
This policy covers both the shesblejks.com website and the ShesBlej mobile app.

When you register, we collect: your name, email, phone number and account type (individual/business, with a company name if you choose business). When you post a listing, we collect the listing details and photos you upload. When you send messages, we store the content of messages between you and other users.

In the mobile app we also collect:

- **Precise location** — only when you mark a property listing's position on the map, and only after you grant permission. It is stored as part of that listing, not as a movement trail.
- **Photos** you pick or take with the camera, only those you attach to a listing.
- **A device notification identifier** (push token), only if you enable notifications, so we can alert you when a message arrives.

### 2. What we do NOT collect
We do not collect ID numbers, dates of birth, payment data, your contacts, or your browsing history. We use no advertising trackers and build no advertising profiles.

### 3. How we store data
Data is stored in a secure database (Supabase/PostgreSQL) with row-level access controls — each user only sees their own data, except administrators for investigation purposes.

### 4. Who we share data with
We do not sell or share your personal data with third parties for marketing purposes. Our infrastructure provider (Supabase) processes data on our behalf under their data processing terms.

### 5. Your rights and account deletion
You have the right to request access to, correction of, or deletion of your personal data.

You can delete your account yourself at any time:

- **In the app:** Account → Delete account.
- **On the web:** through [shesblejks.com/account-deletion](https://shesblejks.com/account-deletion), or by writing to info@shesblejks.com.

Deletion permanently removes your account, your listings and their photos. Messages you sent to other people may remain with the recipient, the same way a sent message does.

### 6. Data retention
Account data is retained for as long as your account is active. Listings expire automatically 29 days after posting if not renewed. After account deletion, data is removed from our systems within 30 days.

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

export default async function PrivacyPage() {
  const lang = await getLang();
  const content = lang === 'sq' ? SQ : EN;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-2xl border border-glass-border bg-surface p-7">{renderMarkdownLite(content)}</div>
    </main>
  );
}
