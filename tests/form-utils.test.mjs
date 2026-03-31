import test from 'node:test';
import assert from 'node:assert/strict';

import {
  toggleDelimitedSelection,
  toggleSchoolPreferenceSelection,
  moveListItem,
  formatSchoolPreference,
  formatHomeProvincePreference,
  buildSubmitPayload,
  getFormFlowConfig,
  getFormModeOptions,
  normalizeFormMode,
} from '../app/lib/form-utils.mjs';

test('toggleDelimitedSelection adds and removes city values', () => {
  assert.equal(toggleDelimitedSelection('', '成都'), '成都');
  assert.equal(toggleDelimitedSelection('成都', '成都'), '');
  assert.equal(toggleDelimitedSelection('成都、武汉', '成都'), '武汉');
  assert.equal(toggleDelimitedSelection('成都、武汉', '重庆'), '成都、武汉、重庆');
});

test('toggleSchoolPreferenceSelection supports multi select with exclusive none option', () => {
  assert.deepEqual(toggleSchoolPreferenceSelection([], '985'), ['985']);
  assert.deepEqual(toggleSchoolPreferenceSelection(['985'], '211'), ['985', '211']);
  assert.deepEqual(toggleSchoolPreferenceSelection(['985', '211'], '985'), ['211']);
  assert.deepEqual(toggleSchoolPreferenceSelection(['985', '211'], '无特殊偏好'), ['无特殊偏好']);
  assert.deepEqual(toggleSchoolPreferenceSelection(['无特殊偏好'], '双一流'), ['双一流']);
});

test('moveListItem reorders priorities by direction', () => {
  const items = ['考公 / 考编', '考研深造', '本科直接就业'];

  assert.deepEqual(moveListItem(items, '考研深造', 'up'), ['考研深造', '考公 / 考编', '本科直接就业']);
  assert.deepEqual(moveListItem(items, '考公 / 考编', 'up'), items);
  assert.deepEqual(moveListItem(items, '考公 / 考编', 'down'), ['考研深造', '考公 / 考编', '本科直接就业']);
});

test('format helpers support new multi-select and province preference values', () => {
  assert.equal(formatSchoolPreference(['985', '211']), '985、211');
  assert.equal(formatSchoolPreference('公办优先'), '公办优先');
  assert.equal(formatHomeProvincePreference('home'), '本省优先');
  assert.equal(formatHomeProvincePreference('out'), '外省优先');
  assert.equal(formatHomeProvincePreference('unsure'), '不确定');
  assert.equal(formatHomeProvincePreference(true), '本省优先');
  assert.equal(formatHomeProvincePreference(false), '不确定');
});

test('buildSubmitPayload fills sensible defaults for auto mode', () => {
  assert.deepEqual(
    buildSubmitPayload(
      {
        province: '浙江',
        score: '618',
        rank: '15234',
        subject_type: '物理类',
        strong_subjects: ['数学', '物理'],
      },
      'auto'
    ),
    {
      province: '浙江',
      score: '618',
      rank: '15234',
      subject_type: '物理类',
      strong_subjects: ['数学', '物理'],
      form_mode: 'auto',
      accept_adjustment: true,
      decision_maker: '一起',
      accept_out_province: true,
      prefer_home_province: 'unsure',
      school_preference: [],
      target_city: '',
      path_priority: ['本科直接就业', '市场化高薪', '考研深造', '国企 / 央企', '考公 / 考编'],
    }
  );
});

test('getFormFlowConfig exposes shorter step flow for auto mode', () => {
  const guided = getFormFlowConfig('guided');
  const auto = getFormFlowConfig('auto');

  assert.equal(guided.steps.length, 4);
  assert.equal(auto.steps.length, 2);
  assert.deepEqual(auto.steps.map((step) => step.id), ['basic', 'student']);
  assert.equal(auto.helperText[0].includes('先不用想学校和专业'), true);
  assert.equal(auto.helperText[1].includes('不需要先选城市或学校'), true);
});

test('getFormModeOptions exposes standalone entry page cards', () => {
  const options = getFormModeOptions();

  assert.equal(options.length, 2);
  assert.equal(options[0].href, '/form/guided');
  assert.equal(options[1].href, '/form/auto');
  assert.equal(options[0].highlights.includes('更多自主选择，如地域偏好和未来规划路径。更适合对未来有清晰规划的学生和家长'), true);
  assert.equal(options[1].highlights.includes('输入更少，更适合对未来没有清晰规划的学生和家长'), true);
});

test('normalizeFormMode keeps supported routes and falls back to guided', () => {
  assert.equal(normalizeFormMode('guided'), 'guided');
  assert.equal(normalizeFormMode('auto'), 'auto');
  assert.equal(normalizeFormMode('unknown'), 'guided');
});
