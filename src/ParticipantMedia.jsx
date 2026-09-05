import { useEffect, useRef } from 'react';
import { youtubeEmbedUrl } from './core/mediaUrl.js';

// Port of the legacy MediaStep stimulus renderer to the declarative participant UI:
// direct URL video/audio/image plus YouTube embed (which a bare <video src> cannot
// play). YouTube fires media_started / media_ended / media_error through the IFrame
// API so completion.mode === 'media-ended' still advances when playback finishes.

export default function ParticipantMedia({ source, mediaType = 'image', controls = true, autoPlay = false, disabled = false, alt = '', fit = 'contain', style, className = '', onMediaEvent }) {
  const mediaRef = useRef(null);
  const youtubeRef = useRef(null);
  const youtubePlaying = useRef(false);
  const resumePlayback = useRef(false);
  useEffect(() => {
    const media = mediaRef.current;
    if (youtubeRef.current) {
      if (disabled) { resumePlayback.current = youtubePlaying.current; youtubeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), 'https://www.youtube-nocookie.com'); }
      else if (resumePlayback.current) { resumePlayback.current = false; youtubeRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), 'https://www.youtube-nocookie.com'); }
    }
    if (!media) return;
    if (disabled) { resumePlayback.current = !media.paused; media.pause(); }
    else if (resumePlayback.current) { resumePlayback.current = false; media.play().catch(() => {}); }
  }, [disabled]);
  const eventHandler = useRef(onMediaEvent);
  const ytEnded = useRef(false);
  const youtubeUrl = youtubeEmbedUrl(source);

  useEffect(() => { eventHandler.current = onMediaEvent; }, [onMediaEvent]);

  useEffect(() => {
    if (!youtubeUrl) return undefined;
    ytEnded.current = false;
    const handler = event => {
      if (event.origin !== 'https://www.youtube-nocookie.com') return;
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      if (data.event === 'onStateChange') {
        youtubePlaying.current = data.info === 1;
        if (data.info === 1) eventHandler.current?.('media_started', { mediaType: 'video' });
        if (data.info === 2) eventHandler.current?.('media_paused', { mediaType: 'video' });
        if (data.info === 0 && !ytEnded.current) { ytEnded.current = true; eventHandler.current?.('media_ended', { mediaType: 'video' }); }
      }
      if (data.event === 'onError') eventHandler.current?.('media_error', { mediaType: 'video' });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [youtubeUrl]);

  if (!source) return <div className={`participant-ui-media missing ${className}`} style={style}>Media source not configured</div>;
  if (youtubeUrl) return <div className={`participant-ui-media embed ${className}`} style={style}><iframe ref={youtubeRef} src={youtubeUrl} title="Stimulus" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>;
  if (mediaType === 'video') return <video ref={mediaRef} className={`participant-ui-media ${className}`} style={style} src={source} controls={controls} autoPlay={autoPlay} playsInline onPlay={() => onMediaEvent?.('media_started', { mediaType: 'video' })} onEnded={() => onMediaEvent?.('media_ended', { mediaType: 'video' })} onError={() => onMediaEvent?.('media_error', { mediaType: 'video' })} />;
  if (mediaType === 'audio') return <audio ref={mediaRef} className={`participant-ui-media ${className}`} style={style} src={source} controls autoPlay={autoPlay} onPlay={() => onMediaEvent?.('media_started', { mediaType: 'audio' })} onEnded={() => onMediaEvent?.('media_ended', { mediaType: 'audio' })} onError={() => onMediaEvent?.('media_error', { mediaType: 'audio' })} />;
  return <img className={`participant-ui-media ${className}`} src={source} alt={alt || ''} style={{ objectFit: fit, ...style }} onLoad={() => onMediaEvent?.('media_loaded', { mediaType: 'image' })} onError={() => onMediaEvent?.('media_error', { mediaType: 'image' })} />;
}
