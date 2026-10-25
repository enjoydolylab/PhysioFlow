import { useLanguage, translate } from '../i18n.jsx';
import { composerStrings } from './composerStrings.js';

// Scope these additions to editor chrome; participant content and other pages
// must not acquire new translations through the legacy DOM walker.
export function translateComposer(key, language) {
  return composerStrings[language]?.[key] || translate(key, language);
}

export function useComposerT() {
  const { language } = useLanguage();
  return key => translateComposer(key, language);
}
