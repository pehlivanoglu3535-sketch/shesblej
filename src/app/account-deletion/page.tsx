/**
 * Hesap silme talebi sayfası.
 *
 * NEDEN AYRI BİR SAYFA
 * Google Play'in Veri Güvenliği formu, hesap açtıran her uygulamadan
 * uygulamanın DIŞINDA, herkesin açabileceği bir silme talebi adresi
 * istiyor: uygulamayı kaldırmış bir kullanıcının da verisini sildirebilmesi
 * gerekiyor. Uygulama içindeki "Hesabımı sil" düğmesi tek başına bu şartı
 * karşılamıyor ve eksikliği yayın başvurusunda takılma sebebi.
 *
 * Sayfa bilerek form içermiyor. Silmeyi yapan şey `delete_own_account`
 * fonksiyonu ve o, kimliği doğrulanmış oturum gerektiriyor. Buraya bir form
 * koymak, e-posta adresini yazan herkesin başkasının hesabını silmeyi
 * tetikleyebileceği bir uç açardı — doğrulanmış yol zaten uygulamanın ve
 * sitenin içinde.
 */
import type { Metadata } from 'next';

import { getLang } from '@/lib/get-lang';
import { renderMarkdownLite } from '@/lib/markdown-lite';

export const metadata: Metadata = {
  title: 'Fshirja e llogarisë · ShesBlej',
  description:
    'Si ta fshini llogarinë tuaj ShesBlej dhe çfarë të dhënash hiqen — Account deletion for ShesBlej.',
};

const SQ = `
## Fshirja e llogarisë

**Aplikacioni:** ShesBlej (com.shesblej.app)

Llogarinë tuaj mund ta fshini vetë, në çdo kohë, pa na kontaktuar.

### Nga aplikacioni
1. Hapni aplikacionin ShesBlej dhe kyçuni.
2. Shkoni te skeda **Profili**.
3. Prekni **Fshi llogarinë** dhe konfirmoni.

Fshirja kryhet menjëherë dhe nuk kthehet.

### Nëse e keni çinstaluar aplikacionin
Na shkruani nga e njëjta adresë email me të cilën jeni regjistruar:

- **info@shesblejks.com**

Shkruani në temë "Fshirje llogarie". Kërkesën e përpunojmë brenda 30 ditëve dhe ju njoftojmë kur të përfundojë. Mund t'ju kërkojmë të konfirmoni se adresa është e juaja, që askush tjetër të mos mund të fshijë llogarinë tuaj.

### Çfarë fshihet
- Llogaria dhe të dhënat e profilit (emri, email-i, numri i telefonit).
- Të gjitha shpalljet tuaja dhe fotot e ngarkuara prej jush.
- Të dhënat e ruajtura: shpalljet e preferuara, lista e përdoruesve të bllokuar dhe identifikuesi i njoftimeve.

### Çfarë mund të mbetet
- **Mesazhet që u keni dërguar përdoruesve të tjerë** mbeten te marrësi, njësoj si një mesazh i dërguar që nuk mund ta tërhiqni.
- Të dhënat që duhet t'i ruajmë me ligj (p.sh. raportimet e keqpërdorimit) mbahen vetëm aq sa e kërkon ligji.

Kurrë nuk i shesim të dhënat tuaja. Më shumë: [Politika e Privatësisë](/privacy).
`;

const EN = `
## Account deletion

**App:** ShesBlej (com.shesblej.app)

You can delete your account yourself, at any time, without contacting us.

### From the app
1. Open the ShesBlej app and sign in.
2. Go to the **Account** tab.
3. Tap **Delete account** and confirm.

Deletion happens immediately and cannot be undone.

### If you have uninstalled the app
Write to us from the same email address you registered with:

- **info@shesblejks.com**

Put "Account deletion" in the subject. We process the request within 30 days and tell you when it is done. We may ask you to confirm the address is yours, so that nobody else can delete your account.

### What is deleted
- Your account and profile data (name, email, phone number).
- All of your listings and the photos you uploaded.
- Stored preferences: saved listings, your blocked-user list and your notification identifier.

### What may remain
- **Messages you sent to other users** stay with the recipient, the same way a sent message cannot be recalled.
- Data we are required to keep by law (for example abuse reports) is kept only as long as the law requires.

We never sell your data. More: [Privacy Policy](/privacy).
`;

export default async function AccountDeletionPage() {
  const lang = await getLang();
  const content = lang === 'sq' ? SQ : EN;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="rounded-2xl border border-glass-border bg-surface p-7">
        {renderMarkdownLite(content)}
      </div>
    </main>
  );
}
