// Province data for China
export const PROVINCES = [
  '北京', '天津', '河北', '山西', '内蒙古',
  '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏',
  '陕西', '甘肃', '青海', '宁夏', '新疆',
];

// Subject combinations for new gaokao
export const SUBJECT_TYPES = [
  { value: '物理类', label: '物理类（物理+2门选科）' },
  { value: '历史类', label: '历史类（历史+2门选科）' },
  { value: '理科', label: '理科（旧高考）' },
  { value: '文科', label: '文科（旧高考）' },
];

// Path priorities
export const PATH_OPTIONS = [
  { id: 'civil_service', label: '考公 / 考编' },
  { id: 'graduate', label: '考研深造' },
  { id: 'soe', label: '国企 / 央企' },
  { id: 'direct_employment', label: '本科直接就业' },
  { id: 'market_salary', label: '市场化高薪' },
];

// User identity options
export const USER_ROLES = [
  { value: '家长', label: '我是家长', icon: '👨‍👩‍👧' },
  { value: '学生', label: '我是学生本人', icon: '🧑‍🎓' },
  { value: '一起', label: '学生和家长一起', icon: '🤝' },
];

export const GENDER_OPTIONS = [
  { value: '男', label: '男' },
  { value: '女', label: '女' },
  { value: '不方便透露', label: '不方便透露' },
];

export const SCHOOL_PREFERENCE_OPTIONS = ['985', '211', '双一流', '公办优先', '无特殊偏好'];

export const HOME_PROVINCE_OPTIONS = [
  { value: 'home', label: '本省优先' },
  { value: 'out', label: '外省优先' },
  { value: 'unsure', label: '不确定' },
];

// Interest directions
export const INTERESTS = [
  '计算机/互联网', '人工智能', '电子信息', '机械工程',
  '土木建筑', '医学/药学', '法学', '教育/师范',
  '经济/金融', '工商管理', '会计/审计', '外语/翻译',
  '新闻传播', '心理学', '生物科学', '化学/材料',
  '数学/统计', '物理学', '农学', '艺术设计',
  '其他', '暂不确定',
];

// Hot Cities
export const HOT_CITIES = [
  '北京', '上海', '广州', '深圳', 
  '杭州', '南京', '成都', '武汉', 
  '西安', '重庆'
];

// Strong subjects
export const STRONG_SUBJECTS = [
  '语文', '数学', '英语', '物理', '化学',
  '生物', '政治', '历史', '地理',
];

// Form step configs
export const FORM_STEPS = [
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
