import vine from '@vinejs/vine';

const code = () => vine.string().trim().maxLength(16);
const recoveryCode = () => vine.string().trim().maxLength(32);

/** Either a code from the authenticator app or one recovery code; `code` wins when both are sent. */
const secondFactor = {
  code: code().optional().requiredIfMissing('recoveryCode'),
  recoveryCode: recoveryCode().optional().requiredIfMissing('code'),
};

export const twoFactorLoginValidator = vine.create({
  challenge: vine.string().maxLength(2048),
  ...secondFactor,
});

export const confirmTwoFactorValidator = vine.create({
  password: vine.string(),
  code: code(),
});

export const disableTwoFactorValidator = vine.create({
  password: vine.string(),
  ...secondFactor,
});

export const regenerateRecoveryCodesValidator = vine.create({
  password: vine.string(),
  code: code(),
});
