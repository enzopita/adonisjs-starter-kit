import i18nManager from '@adonisjs/i18n/services/main';
import { BaseMail } from '@adonisjs/mail';

import env from '#start/env';

export interface LinkMailInput {
  email: string;
  link: string;
  locale: string;
}

/**
 * A mail built around one link: `<prefix>.subject`, `preview`, `heading`, `intro`, `action`,
 * `open_link`, `expires` and `footer` in the locale files, rendered by `emails/<view>_html.edge`
 * and `emails/<view>_text.edge`.
 */
export abstract class LinkMail extends BaseMail {
  protected abstract prefix: string;
  protected abstract view: string;
  protected abstract expiresIn: Record<string, number>;
  /** More keys under `prefix` the view renders, passed under the same name. */
  protected extraKeys: string[] = [];

  constructor(private data: LinkMailInput) {
    super();
  }

  prepare() {
    const i18n = i18nManager.locale(this.data.locale);
    const appName = env.get('APP_NAME');

    const t = (key: string, values?: Record<string, string | number>) =>
      i18n.t(`${this.prefix}.${key}`, values);

    const subject = t('subject');

    // Queued mails reach the worker as JSON, so the views get finished strings, not a bound t().
    const view = {
      link: this.data.link,
      lang: this.data.locale.split('-')[0],
      appName,
      subject,
      preview: t('preview', { appName }),
      heading: t('heading'),
      intro: t('intro', { appName }),
      action: t('action'),
      openLink: t('open_link'),
      pasteLink: i18n.t('mail.paste_link'),
      expires: t('expires', this.expiresIn),
      footer: t('footer'),
      ...Object.fromEntries(this.extraKeys.map((key) => [key, t(key)])),
    };

    this.message
      .to(this.data.email)
      .subject(subject)
      .htmlView(`emails/${this.view}_html`, view)
      .textView(`emails/${this.view}_text`, view);
  }
}
