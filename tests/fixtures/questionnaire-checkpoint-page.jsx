// Dedicated local QA page: component lifecycle controls, no production route.
import React, { useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import QuestionnaireForm from '../../src/QuestionnaireFormV2.jsx';
import '../../src/participant-ui.css';
const questionnaire = { questionnaire_id: 'qa-timer', questions: [{ question_id:'timed',type:'short_text',required:true,time_limit_sec:60,prompt_i18n:{en:'QA timed answer'} }] };
function QA() {
  const capture = useRef(null);
  const [paused,setPaused]=useState(false), [mount,setMount]=useState(0), [draft,setDraft]=useState(null), [output,setOutput]=useState(null);
  const onDraftChange = useCallback(value=>{capture.current=value;},[]);
  return <main><h1>QA TEST ONLY — questionnaire checkpoint lifecycle</h1>
    <button onClick={()=>setPaused(value=>!value)}>{paused?'Resume QA':'Pause QA'}</button>
    <button onClick={()=>setOutput(capture.current?.())}>Capture QA checkpoint</button>
    <button onClick={()=>{const saved=capture.current?.();setDraft(saved);setOutput(saved);setMount(value=>value+1);}}>Restore QA checkpoint</button>
    <button onClick={()=>{setDraft(null);setOutput(null);setMount(value=>value+1);}}>New QA attempt</button>
    <QuestionnaireForm key={mount} questionnaire={questionnaire} disabled={paused} initialDraft={draft} onDraftChange={onDraftChange} onSubmit={(answers,metadata)=>setOutput({answers,metadata})}/>
    <pre aria-label="QA checkpoint">{JSON.stringify(output,null,2)}</pre>
  </main>;
}
createRoot(document.getElementById('root')).render(<QA/>);
