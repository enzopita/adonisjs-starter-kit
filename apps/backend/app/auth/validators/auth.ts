import vine from '@vinejs/vine';

import { localeRule, timezoneRule } from '#users/validators/user';

const email = () => vine.string().email().maxLength(254).toLowerCase();
const password = () => vine.string().minLength(8).maxLength(128);

export const signupValidator = vine.create({
  fullName: vine.string().trim().maxLength(255).nullable(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
  locale: localeRule().optional(),
  timezone: timezoneRule().nullable().optional(),
});

export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
});

export const forgotPasswordValidator = vine.create({
  email: email(),
});

export const resetPasswordValidator = vine.create({
  token: vine.string(),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
});

export const verifyEmailValidator = vine.create({
  token: vine.string(),
});
