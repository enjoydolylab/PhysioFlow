// Shared presentation option for video and still-image stimulus nodes.
// Stored on the Media element, not on its asset/pool, so sharing a screen cannot
// accidentally replace stimulus identity or the randomized trial schedule.
export const MEDIA_PRESENTATION_STANDARD = 'standard';
export const MEDIA_PRESENTATION_FULLSCREEN_CONTAIN = 'fullscreen-contain';

export function mediaPresentationMode(element) {
  if (element?.type !== 'Media' || !['image', 'video'].includes(element.props?.mediaType)) return MEDIA_PRESENTATION_STANDARD;
  return element.props?.presentationMode === MEDIA_PRESENTATION_FULLSCREEN_CONTAIN
    ? MEDIA_PRESENTATION_FULLSCREEN_CONTAIN
    : MEDIA_PRESENTATION_STANDARD;
}

export function fullscreenMediaInScreen(screen) {
  if (screen?.type !== 'Screen') return null;
  const walk = element => {
    if (mediaPresentationMode(element) === MEDIA_PRESENTATION_FULLSCREEN_CONTAIN) return element;
    for (const child of element.children || []) {
      const match = walk(child);
      if (match) return match;
    }
    return null;
  };
  return walk(screen);
}
