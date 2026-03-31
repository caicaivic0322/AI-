export function parseDelimitedSelection(value = '') {
  return String(value)
    .split('、')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function stringifyDelimitedSelection(items = []) {
  return items.filter(Boolean).join('、');
}

export function toggleDelimitedSelection(currentValue = '', item) {
  const items = parseDelimitedSelection(currentValue);

  if (items.includes(item)) {
    return stringifyDelimitedSelection(items.filter((entry) => entry !== item));
  }

  return stringifyDelimitedSelection([...items, item]);
}

export function toggleSchoolPreferenceSelection(currentValue = [], item) {
  const values = Array.isArray(currentValue)
    ? currentValue.filter(Boolean)
    : currentValue
      ? [currentValue]
      : [];

  if (item === '无特殊偏好') {
    return values.includes(item) ? [] : ['无特殊偏好'];
  }

  const filtered = values.filter((value) => value !== '无特殊偏好');

  if (filtered.includes(item)) {
    return filtered.filter((value) => value !== item);
  }

  return [...filtered, item];
}

export function moveListItem(items = [], item, direction = 'up') {
  const index = items.indexOf(item);

  if (index === -1) {
    return items;
  }

  if (direction === 'up' && index === 0) {
    return items;
  }

  if (direction === 'down' && index === items.length - 1) {
    return items;
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  const nextItems = [...items];
  const [moved] = nextItems.splice(index, 1);
  nextItems.splice(targetIndex, 0, moved);
  return nextItems;
}

export function formatSchoolPreference(value) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join('、') : '无特殊偏好';
  }

  return value || '无特殊偏好';
}

export function formatHomeProvincePreference(value) {
  if (value === 'home' || value === true) {
    return '本省优先';
  }

  if (value === 'out') {
    return '外省优先';
  }

  return '不确定';
}

const GUIDED_STEPS = [
  {
    id: 'basic',
    title: '基础信息',
    description: '告诉我们你的高考成绩基本情况',
    icon: '📋',
  },
  {
    id: 'preference',
    title: '地域偏好',
    description: '你希望去哪里读大学？',
    icon: '📍',
  },
  {
    id: 'family',
    title: '路径规划',
    description: '你对未来发展方向的期望',
    icon: '🧭',
  },
  {
    id: 'student',
    title: '学生画像',
    description: '了解你的兴趣和特长',
    icon: '🎯',
  },
];

const AUTO_STEPS = [
  GUIDED_STEPS[0],
  {
    id: 'student',
    title: '优势学科',
    description: '让 AI 从你擅长的科目出发自动规划',
    icon: '🪄',
  },
];

const GUIDED_HELPER_TEXT = [
  '先确认基础分数信息，我们会据此建立你的定位。',
  '地域和院校偏好会直接影响推荐边界与筛选顺序。',
  '把家庭决策逻辑说清楚，报告会更贴近真实讨论场景。',
  '最后补充学生画像，让推荐更像“为你做的”而不是模板。',
];

const AUTO_HELPER_TEXT = [
  '先不用想学校和专业，只需要告诉我们成绩、位次和选科，AI 会先建立你的基础竞争力画像。',
  '再补充你更擅长的学科，不需要先选城市或学校，AI 会自动缩小范围并推断更适合的方向。',
];

const DEFAULT_AUTO_PATH_PRIORITY = ['本科直接就业', '市场化高薪', '考研深造', '国企 / 央企', '考公 / 考编'];

const FORM_MODE_OPTIONS = [
  {
    value: 'guided',
    href: '/form/guided',
    label: '我自己细化填写',
    badge: '更细致',
    title: '我有一些偏好，想自己把条件说清楚',
    description: '适合已经对城市、学校层次、发展路径有初步想法的人。',
    highlights: ['更多自主选择，如地域偏好和未来规划路径。更适合对未来有清晰规划的学生和家长'],
  },
  {
    value: 'auto',
    href: '/form/auto',
    label: '让 AI 全自动规划',
    badge: '更省事',
    title: '我先不用做选择，让 AI 帮我缩小范围',
    description: '只填核心成绩信息和擅长科目，AI 会先帮你判断适合冲什么、稳什么、保什么。',
    highlights: ['输入更少，更适合对未来没有清晰规划的学生和家长'],
  },
];

export function normalizeFormMode(mode = 'guided') {
  return mode === 'auto' ? 'auto' : 'guided';
}

export function getFormModeOptions() {
  return FORM_MODE_OPTIONS;
}

export function getFormFlowConfig(mode = 'guided') {
  const normalizedMode = normalizeFormMode(mode);

  return normalizedMode === 'auto'
    ? {
        mode: 'auto',
        steps: AUTO_STEPS,
        helperText: AUTO_HELPER_TEXT,
      }
    : {
        mode: 'guided',
        steps: GUIDED_STEPS,
        helperText: GUIDED_HELPER_TEXT,
      };
}

export function buildSubmitPayload(formData = {}, mode = 'guided') {
  if (mode !== 'auto') {
    return formData;
  }

  return {
    ...formData,
    form_mode: 'auto',
    accept_adjustment: formData.accept_adjustment ?? true,
    decision_maker: formData.decision_maker || '一起',
    accept_out_province: formData.accept_out_province ?? true,
    prefer_home_province: formData.prefer_home_province || 'unsure',
    school_preference: Array.isArray(formData.school_preference) ? formData.school_preference : [],
    target_city: formData.target_city || '',
    path_priority: Array.isArray(formData.path_priority) && formData.path_priority.length > 0
      ? formData.path_priority
      : DEFAULT_AUTO_PATH_PRIORITY,
  };
}
