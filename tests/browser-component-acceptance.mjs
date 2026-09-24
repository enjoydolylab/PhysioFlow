import assert from 'node:assert/strict';

// Actual React controls in the existing isolated browser test harness. Every
// assertion checks rendered state or submission, not a duplicated implementation.
export async function verifyComponentAcceptance(evaluate, waitFor) {
  await evaluate(`(async()=>{
    const React=(await import('/node_modules/.vite/deps/react.js')).default;
    const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const core=await import('/src/core/index.js');
    const {default:Renderer}=await import('/src/ParticipantRenderer.jsx');
    const {default:Questionnaire}=await import('/src/QuestionnaireFormV2.jsx');
    const {default:Media}=await import('/src/ParticipantMedia.jsx');
    const host=document.createElement('div');host.id='component-acceptance';document.body.append(host);
    window.acceptanceRoot=createRoot(host);
    window.acceptanceMount=(kind,props)=>{window.acceptanceValue=null;acceptanceRoot.render(React.createElement(kind==='ui'?Renderer:kind==='questionnaire'?Questionnaire:Media,{key:crypto.randomUUID(),...props,onSubmit:(...result)=>window.acceptanceValue=result}));};
    window.acceptanceInput=(selector,value)=>{const el=host.querySelector(selector);const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));};
    window.acceptanceClick=text=>{const button=[...host.querySelectorAll('button')].find(b=>b.textContent.trim()===text);if(!button)throw Error('Missing '+text);button.click();};
    window.acceptanceSchema=core.createParticipantScreen({children:[core.createUiElement('Input',{props:{name:'n',label:'Number',inputType:'number',required:true,min:0,max:10}}),core.createUiElement('Input',{props:{name:'r',label:'Rating',inputType:'rating',required:true,min:0,max:2}}),core.createUiElement('Button',{props:{label:'Submit'},actions:[{event:'click',action:'submit'}]})]});
    acceptanceMount('ui',{schema:acceptanceSchema});
  })()`);
  const text=`document.querySelector('#component-acceptance').textContent`;
  await waitFor(`!!document.querySelector('#component-acceptance input')`,'numeric input mounted');
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('#component-acceptance .participant-rating button')].map(b=>b.textContent)`),['0','1','2'],'rating renders zero boundary');
  await evaluate(`acceptanceClick('0');acceptanceInput('input','5')`);
  await waitFor(`document.querySelector('#component-acceptance input').value==='5'`,'number updated');
  await evaluate(`acceptanceInput('input','')`);
  await waitFor(`document.querySelector('#component-acceptance input').value===''`,'blank number stays blank');
  await evaluate(`acceptanceClick('Submit')`);
  await waitFor(`(${text}).includes('Required')`,'blank required numeric rejected');
  assert.equal(await evaluate(`window.acceptanceValue`),null);
  await evaluate(`acceptanceInput('input','11')`);
  await waitFor(`document.querySelector('#component-acceptance input').value==='11'`,'out-of-range numeric entered');
  await evaluate(`acceptanceClick('Submit')`);
  assert.equal(await evaluate(`window.acceptanceValue`),null,'out-of-range numeric rejected');
  await evaluate(`acceptanceInput('input','0')`);
  await waitFor(`document.querySelector('#component-acceptance input').value==='0'`,'zero numeric entered');
  await evaluate(`acceptanceClick('Submit')`);
  await waitFor(`!!window.acceptanceValue`,'zero accepted');
  assert.deepEqual(await evaluate(`acceptanceValue[0].values`),{n:0,r:0});

  await evaluate(`acceptanceMount('questionnaire',{language:'en',questionnaire:{questionnaire_id:'range',name:'Range',questions:[{question_id:'number',type:'number',required:true,prompt_i18n:{en:'Number'},scale_min:0,scale_max:5}]}})`);
  await waitFor(`!!document.querySelector('#component-acceptance .qf-text')`,'questionnaire number mounted');
  await evaluate(`acceptanceInput('input','6')`);
  await waitFor(`document.querySelector('#component-acceptance input').value==='6'`,'questionnaire out-of-range input');
  await evaluate(`acceptanceClick('Submit')`);
  assert.equal(await evaluate(`window.acceptanceValue`),null,'questionnaire enforces range');
  await evaluate(`acceptanceInput('input','0')`);
  await waitFor(`document.querySelector('#component-acceptance input').value==='0'`,'questionnaire zero');
  await evaluate(`acceptanceClick('Submit')`);
  await waitFor(`!!window.acceptanceValue`,'questionnaire zero submits');
  assert.equal(await evaluate(`acceptanceValue[0].number`),0);

  await evaluate(`acceptanceMount('questionnaire',{language:'en',questionnaire:{questionnaire_id:'conditional-score',questions:[{question_id:'gate',type:'short_text',required:true,prompt_i18n:{en:'Gate'},correct_answer:'no'},{question_id:'hidden',type:'short_text',required:true,prompt_i18n:{en:'Hidden'},correct_answer:'42',show_if:{question_id:'gate',operator:'equals',value:'yes'}}]}})`);
  await waitFor(`!!document.querySelector('#component-acceptance .qf-text')`,'conditional question mounted');
  await evaluate(`acceptanceInput('input','no')`);
  await waitFor(`document.querySelector('#component-acceptance input').value==='no'`,'gate answered');
  await evaluate(`acceptanceClick('Submit')`);
  await waitFor(`!!window.acceptanceValue`,'conditional score submitted');
  assert.deepEqual(await evaluate(`acceptanceValue[1].score`),{correct:1,total:1,pct:100},'hidden questions excluded from score denominator');

  await evaluate(`acceptanceMount('questionnaire',{language:'en',questionnaire:{questionnaire_id:'timed-branch',questions:[{question_id:'gate',type:'short_text',required:true,prompt_i18n:{en:'Timed gate'},time_limit_sec:1},{question_id:'followup',type:'short_text',required:true,prompt_i18n:{en:'New follow-up'},show_if:{question_id:'gate',operator:'equals',value:'yes'}}]}})`);
  await waitFor(`!!document.querySelector('#component-acceptance .qf-text')`,'timed branch mounted');
  await evaluate(`acceptanceInput('input','yes')`);
  await waitFor(`(${text}).includes('New follow-up')`,'timeout advances to newly visible question');
  assert.equal(await evaluate(`window.acceptanceValue`),null,'timer must not finish past newly visible required question');
  await evaluate(`acceptanceInput('input','answer')`);
  await waitFor(`document.querySelector('#component-acceptance input').value==='answer'`,'follow-up answered');
  await evaluate(`acceptanceClick('Submit')`);
  await waitFor(`!!window.acceptanceValue`,'timed branch submitted');
  assert.deepEqual(await evaluate(`acceptanceValue[0]`),{gate:'yes',followup:'answer'});
  await evaluate(`acceptanceMount('questionnaire',{language:'en',questionnaire:{questionnaire_id:'nested-branch',questions:[{question_id:'gate',type:'short_text',required:true,prompt_i18n:{en:'Branch gate'}},{question_id:'child',type:'short_text',required:true,prompt_i18n:{en:'Branch child'},show_if:{question_id:'gate',operator:'equals',value:'yes'}},{question_id:'descendant',type:'short_text',required:true,prompt_i18n:{en:'Branch descendant'},show_if:{question_id:'child',operator:'equals',value:'show'}}]}})`);
  await waitFor(`!!document.querySelector('#component-acceptance .qf-text')`,'nested branch mounted');
  await evaluate(`acceptanceInput('input','yes')`);
  await waitFor(`(${text}).includes('Next')`,'child visible');
  await evaluate(`acceptanceClick('Next →')`);
  await waitFor(`(${text}).includes('Branch child')`,'child displayed');
  await evaluate(`acceptanceInput('input','show')`);
  await waitFor(`(${text}).includes('Next')`,'descendant visible');
  await evaluate(`acceptanceClick('Next →')`);
  await waitFor(`(${text}).includes('Branch descendant')`,'descendant displayed');
  await evaluate(`acceptanceInput('input','old answer')`);
  await evaluate(`acceptanceClick('← Previous')`);
  await waitFor(`(${text}).includes('Branch child')`,'return to child');
  await evaluate(`acceptanceClick('← Previous')`);
  await waitFor(`(${text}).includes('Branch gate')`,'return to gate');
  await evaluate(`acceptanceInput('input','no')`);
  await waitFor(`(${text}).includes('Submit') && !(${text}).includes('Next')`,'entire descendant branch hidden');
  await evaluate(`acceptanceClick('Submit')`);
  await waitFor(`!!window.acceptanceValue`,'nested branch submitted');
  assert.deepEqual(await evaluate(`acceptanceValue[0]`),{gate:'no'},'hidden child and descendant answers excluded');
  console.log('Questionnaire acceptance: changing gate hides descendants and excludes stale answers');

  console.log('Questionnaire acceptance: hidden scoring and timed conditional follow-up passed');

  await evaluate(`acceptanceMount('media',{source:'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',mediaType:'audio',controls:false})`);
  await waitFor(`!!document.querySelector('#component-acceptance audio')`,'audio rendered');
  assert.equal(await evaluate(`document.querySelector('#component-acceptance audio').controls`),false,'audio respects controls setting');
  await evaluate(`(async()=>{
    const React=(await import('/node_modules/.vite/deps/react.js')).default;
    const {default:Builder}=await import('/src/ParticipantUiBuilder.jsx');
    const {createParticipantScreen}=await import('/src/core/index.js');
    window.acceptanceSchema=createParticipantScreen({children:[]});
    window.acceptanceElements=()=>{const list=[];const visit=n=>{list.push(n);(n.children||[]).forEach(visit)};visit(acceptanceSchema.root);return list;};
    const render=()=>acceptanceRoot.render(React.createElement(Builder,{key:'all-elements',schema:acceptanceSchema,onChange:next=>{window.acceptanceSchema=next;render();}}));render();
  })()`);
  await waitFor(`!!document.querySelector('#component-acceptance .ui-library-block')`,'element palette mounted');
  for (const type of ['Text','Media','Html','Input','Button','Progress','Layout','Divider','Rectangle','Ellipse']) {
    await evaluate(`[...document.querySelectorAll('#component-acceptance .ui-library-block')].find(el=>el.querySelector('.ui-library-name').textContent===${JSON.stringify(type)}).click()`);
    await waitFor(`acceptanceElements().some(el=>el.type===${JSON.stringify(type)})`,type+' inserted from palette');
  }
  assert.equal(await evaluate(`new Set(acceptanceElements().map(el=>el.type)).size`),11,'all participant element types inserted');
  const beforeDuplicate=await evaluate(`acceptanceElements().length`);
  await evaluate(`document.querySelector('#component-acceptance button[title="Duplicate (Ctrl+D)"]').click()`);
  await waitFor(`acceptanceElements().length===${beforeDuplicate+1}`,'element duplicate');
  await evaluate(`document.querySelector('#component-acceptance button[title="Delete (Del)"]').click()`);
  await waitFor(`acceptanceElements().length===${beforeDuplicate}`,'element delete');
  await evaluate(`document.querySelector('#component-acceptance button[title="Undo (Ctrl+Z)"]').click()`);
  await waitFor(`acceptanceElements().length===${beforeDuplicate+1}`,'element undo delete');
  await evaluate(`document.querySelector('#component-acceptance button[title="Redo (Ctrl+Shift+Z)"]').click()`);
  await waitFor(`acceptanceElements().length===${beforeDuplicate}`,'element redo delete');
  await evaluate(`(async()=>{const {validateParticipantUi}=await import('/src/core/index.js');window.acceptanceValidation=validateParticipantUi(acceptanceSchema);})()`);
  assert.equal(await evaluate(`acceptanceValidation.valid`),true);
  console.log('Element acceptance: all 11 types, palette insertion, duplicate/delete/undo/redo passed');
  await evaluate(`acceptanceRoot.unmount();document.querySelector('#component-acceptance').remove()`);
  console.log('Component acceptance: zero ratings, numeric validation and audio settings passed');
}
