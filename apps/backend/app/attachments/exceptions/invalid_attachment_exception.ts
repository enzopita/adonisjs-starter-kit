import ApiException from '#core/exceptions/api_exception';

/** The attachment is unknown, another user's upload, or not accepted here */
export default class InvalidAttachmentException extends ApiException<'E_INVALID_ATTACHMENT'> {
  static override status = 422;
  static override code = 'E_INVALID_ATTACHMENT';
  static override message =
    'One or more attachments are missing or not accepted here';
}
