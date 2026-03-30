'use client';

import { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PROVINCES, SUBJECT_TYPES, PATH_OPTIONS,
  USER_ROLES, INTERESTS, STRONG_SUBJECTS,
  HOT_CITIES,
  GENDER_OPTIONS,
  SCHOOL_PREFERENCE_OPTIONS,
  HOME_PROVINCE_OPTIONS,
} from '../lib/constants';
import {
  toggleDelimitedSelection,
  toggleSchoolPreferenceSelection,
  moveListItem,
  buildSubmitPayload,
  getFormFlowConfig,
} from '../lib/form-utils.mjs';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function StepBasic({ data, onChange, mode = 'guided' }) {
  useEffect(() => {
    if (data.province) {
      return;
    }

    const controller = new AbortController();

    fetch('/api/geo/province', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((res) => res.ok ? res.json() : { province: null })
      .then((payload) => {
        if (payload?.province) {
          onChange('province', payload.province);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [data.province, onChange]);

  return (
    <>
      <div className="field-group">
        <label className="field-label">省份 <span className="required">*</span></label>
        <select className="field-select" value={data.province || ''} onChange={e => onChange('province', e.target.value)}>
          <option value="">请选择省份</option>
          {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="field-group">
        <label className="field-label">高考分数 <span className="required">*</span></label>
        <input className="field-input" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="例如：560" value={data.score || ''} onChange={e => onChange('score', e.target.value.replace(/\\D/g, ''))} />
      </div>

      <div className="field-group">
        <label className="field-label">全省位次 <span className="required">*</span></label>
        <input className="field-input" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="例如：25000" value={data.rank || ''} onChange={e => onChange('rank', e.target.value.replace(/\\D/g, ''))} />
      </div>

      <div className="field-group">
        <label className="field-label">科类 / 选科组合 <span className="required">*</span></label>
        <div className="option-group">
          {SUBJECT_TYPES.map(st => (
            <label key={st.value} className={`option-item ${data.subject_type === st.value ? 'selected' : ''}`}>
              <input type="radio" value={st.value} checked={data.subject_type === st.value} onChange={e => onChange('subject_type', e.target.value)} />
              <span className="option-dot" />
              <span className="option-text">{st.label}</span>
            </label>
          ))}
        </div>
      </div>

      {mode === 'guided' && (
        <>
          <div className="field-group">
            <label className="field-label">是否服从调剂 <span className="required">*</span></label>
            <div className="option-group">
              {[{ v: true, l: '是，服从调剂' }, { v: false, l: '否，不服从' }].map(opt => (
                <label key={String(opt.v)} className={`option-item ${data.accept_adjustment === opt.v ? 'selected' : ''}`}>
                  <input type="radio" checked={data.accept_adjustment === opt.v} onChange={() => onChange('accept_adjustment', opt.v)} />
                  <span className="option-dot" />
                  <span className="option-text">{opt.l}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">性别</label>
            <div className="option-group">
              {GENDER_OPTIONS.map(opt => (
                <label key={opt.value} className={`option-item ${data.gender === opt.value ? 'selected' : ''}`}>
                  <input type="radio" checked={data.gender === opt.value} onChange={() => onChange('gender', opt.value)} />
                  <span className="option-dot" />
                  <span className="option-text">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function StepPreference({ data, onChange }) {
  const toggleCity = (city) => {
    onChange('target_city', toggleDelimitedSelection(data.target_city || '', city));
  };

  return (
    <>
      <div className="field-group">
        <label className="field-label">意向城市 / 地区</label>
        <div className="chip-group" style={{ marginBottom: '8px' }}>
          {HOT_CITIES.map(city => (
            <button 
              key={city} 
              type="button" 
              className={`chip ${data.target_city?.includes(city) ? 'selected' : ''}`} 
              onClick={() => toggleCity(city)}
            >
              {city}
            </button>
          ))}
        </div>
        <input className="field-input" placeholder="例如：北京、上海、成都…" value={data.target_city || ''} onChange={e => onChange('target_city', e.target.value)} />
      </div>

      <div className="field-group">
        <label className="field-label">是否接受省外</label>
        <div className="option-group">
          {[{ v: true, l: '可以接受省外' }, { v: false, l: '只考虑省内' }].map(opt => (
            <label key={String(opt.v)} className={`option-item ${data.accept_out_province === opt.v ? 'selected' : ''}`}>
              <input type="radio" checked={data.accept_out_province === opt.v} onChange={() => onChange('accept_out_province', opt.v)} />
              <span className="option-dot" />
              <span className="option-text">{opt.l}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">学校层次偏好</label>
        <div className="chip-group">
          {SCHOOL_PREFERENCE_OPTIONS.map(pref => (
            <button
              key={pref}
              type="button"
              className={`chip ${(data.school_preference || []).includes(pref) ? 'selected' : ''}`}
              onClick={() => onChange('school_preference', toggleSchoolPreferenceSelection(data.school_preference, pref))}
            >
              {pref}
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">是否优先留在本省</label>
        <div className="option-group">
          {HOME_PROVINCE_OPTIONS.map(opt => (
            <label key={opt.value} className={`option-item ${data.prefer_home_province === opt.value ? 'selected' : ''}`}>
              <input type="radio" checked={data.prefer_home_province === opt.value} onChange={() => onChange('prefer_home_province', opt.value)} />
              <span className="option-dot" />
              <span className="option-text">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

function SortableItem({ id, idx, total, onMove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
    opacity: isDragging ? 0.9 : 1,
    boxShadow: isDragging ? '0 10px 20px rgba(30,58,95,0.1)' : 'none',
  };

  return (
    <div ref={setNodeRef} style={style} className="sortable-item">
      <span className={`sortable-rank rank-${idx + 1}`}>{idx + 1}</span>
      <span className="sortable-text">{id}</span>
      <div className="sort-buttons">
        <button type="button" className="sort-btn" disabled={idx === 0} onClick={() => onMove(id, 'up')} aria-label={`${id} 上移`}>
          ↑
        </button>
        <button type="button" className="sort-btn" disabled={idx === total - 1} onClick={() => onMove(id, 'down')} aria-label={`${id} 下移`}>
          ↓
        </button>
      </div>
      <div 
        {...attributes} 
        {...listeners} 
        style={{ padding: '8px', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        className="drag-handle"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B8B0A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </div>
    </div>
  );
}

function StepFamily({ data, onChange }) {
  const pathPriority = data.path_priority || PATH_OPTIONS.map(p => p.label);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = pathPriority.indexOf(active.id);
      const newIndex = pathPriority.indexOf(over.id);
      onChange('path_priority', arrayMove(pathPriority, oldIndex, newIndex));
    }
  };

  const handleMove = (item, direction) => {
    onChange('path_priority', moveListItem(pathPriority, item, direction));
  };

  return (
    <>
      <div className="field-group">
        <label className="field-label">你的身份 <span className="required">*</span></label>
        <div className="option-group">
          {USER_ROLES.map(role => (
            <label key={role.value} className={`option-item ${data.decision_maker === role.value ? 'selected' : ''}`}>
              <input type="radio" checked={data.decision_maker === role.value} onChange={() => onChange('decision_maker', role.value)} />
              <span className="option-dot" />
              <div>
                <span className="option-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {role.icon} {role.label}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">路径优先级排序 <span className="required">*</span></label>
        <p style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: 12 }}>可拖拽，也可点击上下箭头调整顺序；排在前面优先级更高。</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pathPriority} strategy={verticalListSortingStrategy}>
            <div className="sortable-list">
              {pathPriority.map((item, idx) => (
                <SortableItem key={item} id={item} idx={idx} total={pathPriority.length} onMove={handleMove} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </>
  );
}

function StepStudent({ data, onChange }) {
  const toggleInterest = (interest) => {
    const current = data.interests || [];
    if (current.includes(interest)) {
      onChange('interests', current.filter(i => i !== interest));
    } else if (current.length < 5) {
      onChange('interests', [...current, interest]);
    }
  };

  const toggleSubject = (subject) => {
    const current = data.strong_subjects || [];
    if (current.includes(subject)) {
      onChange('strong_subjects', current.filter(s => s !== subject));
    } else if (current.length < 4) {
      onChange('strong_subjects', [...current, subject]);
    }
  };

  return (
    <>
      <div className="field-group">
        <label className="field-label">兴趣方向（可选 1-5 个）</label>
        <div className="chip-group">
          {INTERESTS.map(interest => (
            <button key={interest} type="button" className={`chip ${(data.interests || []).includes(interest) ? 'selected' : ''}`} onClick={() => toggleInterest(interest)}>
              {interest}
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">优势学科（可选 1-4 个）</label>
        <div className="chip-group">
          {STRONG_SUBJECTS.map(subject => (
            <button key={subject} type="button" className={`chip ${(data.strong_subjects || []).includes(subject) ? 'selected' : ''}`} onClick={() => toggleSubject(subject)}>
              {subject}
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">是否接受高强度专业</label>
        <div className="option-group">
          {[{ v: true, l: '可以接受（如医学、计算机等）' }, { v: false, l: '希望相对轻松' }].map(opt => (
            <label key={String(opt.v)} className={`option-item ${data.accept_intensive === opt.v ? 'selected' : ''}`}>
              <input type="radio" checked={data.accept_intensive === opt.v} onChange={() => onChange('accept_intensive', opt.v)} />
              <span className="option-dot" />
              <span className="option-text">{opt.l}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">是否愿意考研</label>
        <div className="option-group">
          {[{ v: true, l: '愿意考研' }, { v: false, l: '不太想考研' }].map(opt => (
            <label key={String(opt.v)} className={`option-item ${data.willing_graduate === opt.v ? 'selected' : ''}`}>
              <input type="radio" checked={data.willing_graduate === opt.v} onChange={() => onChange('willing_graduate', opt.v)} />
              <span className="option-dot" />
              <span className="option-text">{opt.l}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

function StepAutoPlan({ data, onChange }) {
  const toggleSubject = (subject) => {
    const current = data.strong_subjects || [];
    if (current.includes(subject)) {
      onChange('strong_subjects', current.filter((item) => item !== subject));
    } else if (current.length < 4) {
      onChange('strong_subjects', [...current, subject]);
    }
  };

  return (
    <>
      <div className="form-mode-panel auto">
        <div className="form-mode-panel-head">
          <span className="form-mode-mini-badge">AI 全自动规划</span>
          <h3>你先不用想城市、学校和专业</h3>
        </div>
        <p>
          只告诉我们你更擅长哪些学科，AI 会结合你的分数、位次和录取可能，
          自动推断更适合的学校层次、专业方向、就业节奏与入学后的发展路径。
        </p>
        <div className="form-mode-auto-notes">
          <span>自动补齐默认偏好</span>
          <span>自动形成冲稳保组合</span>
          <span>自动给出就业与升学建议</span>
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">擅长科目 <span className="required">*</span></label>
        <div className="chip-group">
          {STRONG_SUBJECTS.map(subject => (
            <button key={subject} type="button" className={`chip ${(data.strong_subjects || []).includes(subject) ? 'selected' : ''}`} onClick={() => toggleSubject(subject)}>
              {subject}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

const STEP_COMPONENTS = {
  guided: [StepBasic, StepPreference, StepFamily, StepStudent],
  auto: [StepBasic, StepAutoPlan],
};

const FORM_MODE_OPTIONS = [
  {
    value: 'guided',
    label: '我自己细化填写',
    badge: '更细致',
    title: '我有一些偏好，想自己把条件说清楚',
    description: '适合已经对城市、学校层次、发展路径有初步想法的人。',
    highlights: ['可填写地域偏好', '可排序未来路径', '报告更贴近个人意愿'],
  },
  {
    value: 'auto',
    label: '让 AI 全自动规划',
    badge: '更省事',
    title: '我还没想清楚方向，让 AI 先帮我规划',
    description: '只填核心信息和擅长科目，AI 自动完成学校、专业与就业路径推演。',
    highlights: ['输入更少', '自动补齐缺失偏好', '更适合一头雾水的家长和学生'],
  },
];

export default function FormPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formMode, setFormMode] = useState('guided');
  const [formData, setFormData] = useState({
    path_priority: PATH_OPTIONS.map(p => p.label),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stepKey, setStepKey] = useState(0);
  const [direction, setDirection] = useState('forward');
  const [loadingStage, setLoadingStage] = useState(1);

  useEffect(() => {
    if (!loading) {
      setLoadingStage(1);
      return;
    }

    const timer = window.setInterval(() => {
      setLoadingStage(prev => prev === 4 ? 1 : prev + 1);
    }, 1700);

    return () => window.clearInterval(timer);
  }, [loading]);

  const handleChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError('');
  }, []);

  const handleModeChange = useCallback((nextMode) => {
    if (nextMode === formMode) {
      return;
    }

    setFormMode(nextMode);
    setStep(0);
    setStepKey((value) => value + 1);
    setDirection('forward');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [formMode]);

  const { steps, helperText } = getFormFlowConfig(formMode);

  const validateStep = () => {
    const currentStep = steps[step]?.id;

    if (currentStep === 'basic') {
      if (!formData.province) return '请选择省份';
      if (!formData.score) return '请输入分数';
      if (!formData.rank) return '请输入位次';
      if (!formData.subject_type) return '请选择科类';
      if (formMode === 'guided' && formData.accept_adjustment === undefined) return '请选择是否服从调剂';
    }
    if (currentStep === 'family') {
      if (!formData.decision_maker) return '请选择谁主导决策';
    }
    if (formMode === 'auto' && currentStep === 'student') {
      if (!Array.isArray(formData.strong_subjects) || formData.strong_subjects.length === 0) {
        return '请至少选择 1 门擅长科目';
      }
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    if (step < steps.length - 1) {
      setDirection('forward');
      setStep(step + 1);
      setStepKey(k => k + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setDirection('backward');
      setStep(step - 1);
      setStepKey(k => k + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');

    try {
      const payload = buildSubmitPayload(formData, formMode);
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失败');
      router.push(`/report/${data.reportId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const StepComponent = STEP_COMPONENTS[formMode][step];
  const isLastStep = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;
  const loadingItems = formMode === 'auto'
    ? ['采集核心成绩信息', '构建自动画像', '推演学校与专业', '生成入学与就业规划']
    : ['采集信息完成', '构建考生画像', '生成差异化方案', '复核输出质量'];

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-pulse">
          <div className="loading-pulse-ring" />
          <div className="loading-pulse-ring" />
          <div className="loading-pulse-ring" />
          <div className="loading-icon">🎓</div>
        </div>
        <div>
          <div className="loading-text">{formMode === 'auto' ? 'AI 正在全自动规划志愿方案' : '正在为你生成志愿分析报告'}</div>
          <div className="loading-subtext">{formMode === 'auto' ? 'AI 正在从分数、位次和擅长科目出发，补齐适合你的学校、专业和发展路径…' : 'AI 正在综合分析你的分数、偏好和路径匹配度…'}</div>
        </div>
        <div className="loading-steps">
          {loadingItems.map((item, index) => {
            const stage = index + 1;
            const state = loadingStage === stage ? 'active' : loadingStage > stage ? 'done' : '';
            const icon = state === 'done' ? '✓' : state === 'active' ? '⟳' : '○';

            return (
              <div key={item} className={`loading-step ${state}`}>
                <span className="loading-step-icon">{icon}</span>
                {item}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-header">
        <div className="form-header-inner">
          <span className="form-brand">高考志愿 AI</span>
          <div className="step-progress">
            {steps.map((_, i) => (
              <span key={i} className={`step-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="form-body">
        <div className="form-container">
          <div className="form-mode-grid">
            {FORM_MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`form-mode-card ${formMode === option.value ? 'active' : ''}`}
                onClick={() => handleModeChange(option.value)}
              >
                <div className="form-mode-card-head">
                  <span className="form-mode-badge">{option.badge}</span>
                  <span className="form-mode-label">{option.label}</span>
                </div>
                <strong>{option.title}</strong>
                <p>{option.description}</p>
                <div className="form-mode-points">
                  {option.highlights.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <div className={`step-wrapper step-${direction}`} key={stepKey}>
            <div className="form-step-header">
              <div className="form-step-icon">{steps[step].icon}</div>
              <div className="form-step-text">
                <span className="form-step-kicker">第 {step + 1} / {steps.length} 步 · {formMode === 'auto' ? 'AI 全自动' : '自主填写'}</span>
                <h2>{steps[step].title}</h2>
                <p>{steps[step].description}</p>
              </div>
            </div>

            <div className="form-step-hint">
              <span className="form-step-hint-dot" />
              <span>{helperText[step]}</span>
            </div>

            <StepComponent data={formData} onChange={handleChange} mode={formMode} />

            {error && <div className="error-toast">{error}</div>}
          </div>
        </div>
      </div>

      <div className="form-nav">
        {step > 0 && (
          <button className="btn btn-back" onClick={handleBack}>← 上一步</button>
        )}
        {isLastStep ? (
          <button className="btn btn-submit" onClick={handleSubmit}>{formMode === 'auto' ? '🪄 让 AI 全自动规划' : '🎓 生成志愿报告'}</button>
        ) : (
          <button className="btn btn-next" onClick={handleNext}>下一步 →</button>
        )}
      </div>
    </div>
  );
}
