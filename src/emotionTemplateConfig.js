export function validateEmotionTemplateConfig(config) {
 const errors=[];
 for(const key of ['fixationMs','recoveryMs']) {
  const value=config[key];
  if(value==='' || !Number.isSafeInteger(Number(value)) || Number(value)<0 || Number(value)>3600000) errors.push('Use whole milliseconds from 0 to 3,600,000.');
 }
 if(!['fixed','random','latin_square'].includes(config.orderRule)) errors.push('Choose a supported condition order.');
 if(config.seed==='' || !Number.isSafeInteger(Number(config.seed)) || Number(config.seed)<0 || Number(config.seed)>2147483647) errors.push('Use a whole seed from 0 to 2,147,483,647.');
 return {valid:!errors.length,errors:[...new Set(errors)],options:{fixationMs:Number(config.fixationMs),recoveryMs:Number(config.recoveryMs),seed:Number(config.seed),orderRule:config.orderRule}};
}
