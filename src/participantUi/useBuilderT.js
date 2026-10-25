import { useCallback } from 'react';
import { useLanguage } from '../i18n.jsx';
import { translateComposer } from '../composer/translate.js';
export function useBuilderT() {
  const { language } = useLanguage();
  return useCallback(key => translateComposer(key, language), [language]);
}
