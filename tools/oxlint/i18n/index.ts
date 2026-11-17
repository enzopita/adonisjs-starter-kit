import { defineRule, eslintCompatPlugin } from '@oxlint/plugins';

const LETTER = /\p{L}/u;

/** Props whose string value a person reads, on DOM elements and on this app's components. */
const TEXT_PROP =
  /(label|title|description|placeholder|alt|text|message|heading)$/i;

type Node = {
  type: string;
  raw?: string;
  quasis?: { value: { cooked?: string | null } }[];
};

/** A string or template literal with a letter in its text; numbers and punctuation pass. */
function hasLetters(node: Node | null | undefined): boolean {
  if (node?.type === 'Literal')
    return /^['"]/.test(node.raw ?? '') && LETTER.test(node.raw ?? '');

  if (node?.type === 'TemplateLiteral') {
    return (node.quasis ?? []).some((quasi) =>
      LETTER.test(quasi.value.cooked ?? '')
    );
  }

  return false;
}

const noUntranslatedTextRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow user-facing text that skips the translations.',
    },
    messages: {
      untranslated:
        'Add this text to apps/frontend/src/locales/en-US and pt-BR, and render it with t(key) from @/features/core/i18n.',
    },
  },
  createOnce(context) {
    return {
      JSXText(node) {
        if (LETTER.test(node.value))
          context.report({ node, messageId: 'untranslated' });
      },
      JSXAttribute(node) {
        if (
          node.name.type !== 'JSXIdentifier' ||
          !TEXT_PROP.test(node.name.name)
        )
          return;

        const value =
          node.value?.type === 'JSXExpressionContainer'
            ? node.value.expression
            : node.value;

        if (hasLetters(value))
          context.report({ node, messageId: 'untranslated' });
      },
      JSXExpressionContainer(node) {
        if (node.parent.type === 'JSXAttribute') return;

        if (hasLetters(node.expression))
          context.report({ node, messageId: 'untranslated' });
      },
      CallExpression(node) {
        const { callee } = node;

        const isToast =
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'toast';

        if (isToast && hasLetters(node.arguments[0])) {
          context.report({ node, messageId: 'untranslated' });
        }
      },
    };
  },
});

/** Keeps every string a person reads in the frontend inside its translations. */
export default eslintCompatPlugin({
  meta: { name: 'i18n' },
  rules: { 'no-untranslated-text': noUntranslatedTextRule },
});
