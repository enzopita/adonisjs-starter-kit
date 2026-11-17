import { RequestValidator } from '@adonisjs/core/http';
import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';
import { I18n } from '@adonisjs/i18n';
import i18nManager from '@adonisjs/i18n/services/main';

/**
 * Answers each request in the supported locale that best matches its Accept-Language header,
 * falling back to the default locale. A language matches on its primary subtag too, so `pt-PT`
 * reads pt-BR rather than the default.
 */
export default class DetectUserLocaleMiddleware {
  static {
    RequestValidator.messagesProvider = (ctx) =>
      ctx.i18n.createMessagesProvider();
  }

  handle(ctx: HttpContext, next: NextFn) {
    const locale = i18nManager.getSupportedLocaleFor(
      ctx.request
        .languages()
        .flatMap((language) => [language, language.split('-')[0] ?? language])
    );

    ctx.i18n = i18nManager.locale(locale ?? i18nManager.defaultLocale);
    ctx.containerResolver.bindValue(I18n, ctx.i18n);

    return next();
  }
}

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    i18n: I18n;
  }
}
