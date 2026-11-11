// Virtual Optical Table: all presets (basic set from table_presets_basic.js, simplified literature set from table_presets_lit.js,
// set-ups of the Parker, Pathak and Hughes labs from table_presets_labs.js).
import { BASIC, ids } from './table_presets_basic.js';
import { LIT } from './table_presets_lit.js';
import { LABS } from './table_presets_labs.js';

export const PRESETS = [...BASIC.map(p => ({ group: 'basic', ...p })), ...LIT.map(p => ({ group: 'literature', ...p })), ...LABS.map(p => ({ group: 'labs', ...p }))]
  .map(p => ({ ...p, components: ids(p.components) }));
export const presetById = id => PRESETS.find(p => p.id === id);
