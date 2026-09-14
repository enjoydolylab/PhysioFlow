import { createParticipantScreen, createUiElement } from '../core/index.js';

export const SCREEN_PRESETS = [
  { id: 'fixation', label: 'Centered fixation', hint: 'A centered cross for rest or fixation.' },
  { id: 'stimulus', label: 'Image and instructions', hint: 'A stimulus area with a short instruction.' },
  { id: 'comparison', label: 'Left / right stimuli', hint: 'Two equally sized stimulus areas.' },
  { id: 'question', label: 'Question and rating', hint: 'A prompt, rating response and submit button.' },
];

export function createScreenPreset(kind) {
  const text = (text, x, y, width, fontSize = '28px') => createUiElement('Text', { props: { text, x, y, width, fontSize, zeroMargin:true } });
  const media = (x, y, width, height) => createUiElement('Media', { props: { mediaType: 'image', sourceUrl: '', alt: 'Choose a stimulus image', x, y, width, height } });
  const children = kind === 'fixation' ? [createUiElement('Text', {props:{text:'+', x:590, y:310, width:100, height:100, zeroMargin:true}, style:{fontSize:'72px', lineHeight:'100px', textAlign:'center'}})]
    : kind === 'stimulus' ? [media(320, 80, 640, 420), text('Observe the image.', 240, 540, 800)]
      : kind === 'comparison' ? [media(100, 130, 480, 360), media(700, 130, 480, 360), text('Compare the two images.', 240, 540, 800)]
        : [text('How do you feel?', 240, 140, 800), createUiElement('Input', { props: { name:'rating', label:'Rating', inputType:'rating', min:1, max:7, required:true, x:340, y:270, width:600 } }),
          createUiElement('Button', { props: { label:'Submit', x:540, y:440, width:200 }, actions:[{event:'click', action:'submit'}] })];
  return createParticipantScreen({ props: { free:true, screenWidth:1280, screenHeight:720, maxWidth:1280 }, children });
}
