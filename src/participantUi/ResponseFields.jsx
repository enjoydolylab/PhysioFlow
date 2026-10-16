import { parseResponseOptions } from '../core/responseOptions.js';
import { useT } from '../i18n';

const TYPE_LABELS = { text: 'Text Input', textarea: 'Multiline', number: 'Number input', rating: 'Rating', checkbox: 'Checkbox', choice: 'Single choice', multi_choice: 'Multiple choice' };

export function ResponseFields({ elements, validationErrors = [], onLocate }) {
  const t = useT();
  const inputs = elements.filter(item => item.element.type === 'Input').map(item => item.element);
  return <details className="ui-response-fields">
    <summary>{t('Response fields')} · {inputs.length}</summary>
    <p>{t('These are input fields on this screen. Button actions may submit additional values.')}</p>
    <div className="ui-response-field-list">{inputs.map(element => {
      const props = element.props || {};
      const name = typeof props.name === 'string' && props.name.trim() ? props.name : null;
      const type = typeof props.inputType === 'string' && props.inputType ? props.inputType : 'text';
      const typeLabel = Object.hasOwn(TYPE_LABELS, type) ? t(TYPE_LABELS[type]) : type;
      const invalid = validationErrors.some(issue => issue.elementId === element.id);
      const options = ['choice', 'multi_choice'].includes(props.inputType) ? parseResponseOptions(props.options) : [];
      return <article className="ui-response-field" data-response-field={element.id} key={element.id}>
        <div><code translate="no">{name || t('Unnamed response')}</code><small translate="no">{typeLabel} · {t(props.required ? 'Required' : 'Optional')}</small>{invalid && <strong className="ui-invalid">{t('Needs attention')}</strong>}</div>
        <button type="button" aria-label={t('Configure response {name}').replace('{name}', name || t('Unnamed response'))} onClick={() => onLocate(element.id, 'Response name')}>{t('Configure')}</button>
        {options.length > 0 && <div className="ui-response-values"><small>{t('Recorded values')}{props.inputType === 'multi_choice' && ` · ${t('Array response')}`}</small>{options.map((option, index) => <code translate="no" key={`${index}-${option.value}`}>{option.value}</code>)}</div>}
      </article>;
    })}</div>
    {!inputs.length && <p>{t('Add an input to define a response field.')}</p>}
  </details>;
}
