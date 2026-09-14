import { elementLabel } from './tree.js';

export function ScreenChecks({ elements, boundsIssues, fixedSize, preview, onLocate, onPreview }) {
  const media = elements.filter(({element}) => element.type === 'Media' && !String(element.props?.sourceUrl || '').trim() && !element.bindings?.sourceUrl);
  const overflow = elements.filter(({element}) => boundsIssues.includes(element.id));
  const label = element => elementLabel(element) || element.props?.alt || `${element.type} ${elements.findIndex(item => item.element.id === element.id) + 1}`;
  return <details className="ui-screen-checks">
    <summary>Screen checks · {overflow.length} outside screen · {media.length} missing media</summary>
    <div className="ui-check-heading"><b>{overflow.length + media.length ? '需要检查的元素' : '基础检查通过'}</b><button type="button" onClick={onPreview}>{preview ? '返回编辑' : '预览实验画面'}</button></div>
    {!fixedSize && <p>当前为响应式页面。选择顶部 Screen size 后，编辑和运行将使用相同的固定分辨率。</p>}
    {preview && overflow.length > 0 && <p>以下越界结果来自最近一次编辑。点击定位可返回编辑并修改。</p>}
    {overflow.map(({element}) => <div className="ui-check-row" key={`bounds-${element.id}`}>
      <div><b>Outside screen: {label(element)}</b><small>部分内容位于屏幕外。检查位置或大小。</small></div>
      <button type="button" aria-label={`定位越界元素 ${label(element)}`} onClick={() => onLocate(element.id, 'Element X')}>定位并修改</button>
    </div>)}
    {media.map(({element}) => <div className="ui-check-row" key={`media-${element.id}`}>
      <div><b>缺少媒体：{label(element)}</b><small>尚未配置图片、音频或视频来源。</small></div>
      <button type="button" aria-label={`配置媒体 ${label(element)}`} onClick={() => onLocate(element.id, 'Media source URL')}>配置媒体</button>
    </div>)}
    {!overflow.length && !media.length && <p>未发现越界元素或缺失的媒体来源。仍需预览确认实际内容；此检查不验证媒体链接能否加载或实验时序。</p>}
  </details>;
}
