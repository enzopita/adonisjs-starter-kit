import string from '@adonisjs/core/helpers/string';

/**
 * Every type the upload endpoint accepts. No svg, html or js: a signed URL
 * served inline would run their scripts.
 */
export const ATTACHMENT_MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
} as const;

export type AttachmentExtname = keyof typeof ATTACHMENT_MIME_TYPES;

export function isAttachmentExtname(value: string): value is AttachmentExtname {
  return Object.hasOwn(ATTACHMENT_MIME_TYPES, value);
}

export const ATTACHMENT_EXTNAMES = Object.keys(ATTACHMENT_MIME_TYPES).filter(
  isAttachmentExtname
);

/** What one consumer use case accepts, checked when it claims an upload. */
export interface AttachmentRule {
  extnames: readonly AttachmentExtname[];
  maxBytes: number;
}

/**
 * @example
 *   const avatarRule = defineAttachmentRule({ extnames: ['jpg', 'png'], maxSize: '2mb' })
 */
export function defineAttachmentRule(input: {
  extnames: readonly AttachmentExtname[];
  maxSize: string | number;
}): AttachmentRule {
  const maxBytes = string.bytes.parse(input.maxSize);

  if (maxBytes === null) {
    throw new Error(`Invalid attachment maxSize "${input.maxSize}"`);
  }

  return { extnames: input.extnames, maxBytes };
}
