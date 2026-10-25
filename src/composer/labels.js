export const isIdentifier = value => typeof value === 'string' && /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/.test(value);

export function humanizeIssueCode(value, labels = {}, language = 'ja') {
  if (!value || isIdentifier(value)) return labels[value] || (language === 'ja' ? '設定を確認してください。' : language === 'zh' ? '请检查设置。' : 'Please check this setting.');
  return value;
}
