import { getLang } from '@/lib/get-lang';

const SQ = `
## Kushtet e Përdorimit

**Përditësuar së fundmi:** ${new Date().toISOString().slice(0, 10)}

### 1. Pranimi i kushteve
Duke përdorur ShesBlej ("Platforma"), ju pranoni këto Kushte të Përdorimit. Nëse nuk pajtoheni, ju lutemi mos e përdorni Platformën.

### 2. Kush mund ta përdorë Platformën
Duhet të keni të paktën 18 vjeç dhe kapacitet ligjor për të lidhur kontrata për të krijuar një llogari ose për të postuar një shpallje.

### 3. Llogaria juaj
Jeni përgjegjës për saktësinë e informacionit të dhënë gjatë regjistrimit dhe për ruajtjen e sigurisë së fjalëkalimit tuaj. Na njoftoni menjëherë nëse dyshoni për qasje të paautorizuar në llogarinë tuaj.

### 4. Shpalljet
- Ju jeni i vetmi përgjegjës për përmbajtjen, saktësinë dhe ligjshmërinë e shpalljeve që postoni.
- Ndalohet postimi i përmbajtjes mashtruese, të paligjshme, ose që shkel të drejtat e palëve të treta.
- ShesBlej rezervon të drejtën të heqë çdo shpallje që shkel këto kushte, pa njoftim paraprak.
- Shpalljet skadojnë automatikisht pas 29 ditësh dhe mund të rinovohen duke i postuar sërish.

### 5. Sjellja e ndaluar
Ndalohet: mashtrimi, ngacmimi i përdoruesve të tjerë, spam-i, shpërndarja e malware-it, imitimi i personave/kompanive të tjera, dhe përdorimi i Platformës për qëllime të paligjshme.

### 6. Mesazhet mes përdoruesve
Sistemi i mesazheve në aplikacion synon lehtësimin e komunikimit mes blerësve dhe shitësve lidhur me shpalljet. Mos e përdorni për qëllime të tjera (spam, reklamim i paautorizuar, etj.).

### 7. Raportimi
Përdoruesit mund të raportojnë shpallje që besojnë se shkelin këto kushte. Ekipi ynë do t'i shqyrtojë raportimet dhe do të ndërmarrë veprime sipas gjykimit tonë.

### 8. Kufizimi i përgjegjësisë
ShesBlej është një platformë që lidh blerës dhe shitës — ne nuk jemi palë në asnjë transaksion mes përdoruesve dhe nuk garantojmë saktësinë e shpalljeve. Përdorimi i Platformës bëhet në rrezikun tuaj.

### 9. Ndërprerja e llogarisë
Rezervojmë të drejtën të pezullojmë ose fshijmë çdo llogari që shkel këto kushte.

### 10. Ndryshimet
Mund t'i përditësojmë këto kushte herë pas here. Vazhdimi i përdorimit të Platformës pas ndryshimeve nënkupton pranimin e kushteve të reja.

### 11. Ligji në fuqi
Këto kushte rregullohen nga ligjet e Republikës së Kosovës.

### 12. Kontakti
Për pyetje rreth këtyre kushteve, na kontaktoni përmes platformës.
`;

const EN = `
## Terms of Service

**Last updated:** ${new Date().toISOString().slice(0, 10)}

### 1. Acceptance of terms
By using ShesBlej ("the Platform"), you agree to these Terms of Service. If you do not agree, please do not use the Platform.

### 2. Who may use the Platform
You must be at least 18 years old and have the legal capacity to enter into contracts to create an account or post a listing.

### 3. Your account
You are responsible for the accuracy of the information provided during registration and for keeping your password secure. Notify us immediately if you suspect unauthorized access to your account.

### 4. Listings
- You are solely responsible for the content, accuracy, and legality of the listings you post.
- Posting fraudulent, illegal content, or content that infringes third-party rights is prohibited.
- ShesBlej reserves the right to remove any listing that violates these terms, without prior notice.
- Listings automatically expire after 29 days and can be renewed by posting them again.

### 5. Prohibited conduct
Prohibited: fraud, harassment of other users, spam, distribution of malware, impersonation of other people or companies, and using the Platform for unlawful purposes.

### 6. Messaging between users
The in-app messaging system is intended to facilitate communication between buyers and sellers regarding listings. Do not use it for other purposes (spam, unauthorized advertising, etc.).

### 7. Reporting
Users may report listings they believe violate these terms. Our team will review reports and take action at our discretion.

### 8. Limitation of liability
ShesBlej is a platform connecting buyers and sellers — we are not a party to any transaction between users and do not guarantee the accuracy of listings. Use of the Platform is at your own risk.

### 9. Account termination
We reserve the right to suspend or delete any account that violates these terms.

### 10. Changes
We may update these terms from time to time. Continued use of the Platform after changes constitutes acceptance of the new terms.

### 11. Governing law
These terms are governed by the laws of the Republic of Kosovo.

### 12. Contact
For questions about these terms, please contact us through the platform.
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
      if (block.startsWith('- ')) {
        return (
          <ul key={i} className="mb-2 list-disc space-y-1 pl-5 text-sm text-[#cbc6ba]">
            {block.split('\n').map((line, j) => (
              <li key={j}>{line.replace(/^- /, '')}</li>
            ))}
          </ul>
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
          {block}
        </p>
      );
    });
}

export default async function TermsPage() {
  const lang = await getLang();
  const content = lang === 'sq' ? SQ : EN;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-2xl border border-glass-border bg-surface p-7">{renderMarkdownLite(content)}</div>
    </main>
  );
}
