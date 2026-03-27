'use client';

import { useState, useCallback } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PROVINCES, SUBJECT_TYPES, PATH_OPTIONS,
  USER_ROLES, INTERESTS, STRONG_SUBJECTS, FORM_STEPS,
  HOT_CITIES,
} from '../lib/constants';
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

function StepBasic({ data, onChange }) {
  useEffect(() => {
    // Auto-fill province on first load via IP mapping if not set
    if (!data.province) {
      fetch('https://whois.pconline.com.cn/ipJson.jsp?json=true', { cache: 'no-store' })
        .then(res => res.arrayBuffer())
        .then(buffer => {
          const text = new TextDecoder('gbk').decode(buffer);
          const ipData = JSON.parse(text);
          if (ipData && ipData.pro) {
            let p = ipData.pro.replace(/省|市|维吾尔自治区|回族自治区|壮族自治区|自治区|特别行政区/g, '');
            if (p === '黑龙') p = '黑龙江';
            if (p === '内蒙') p = '内蒙古';
            if (PROVINCES.includes(p)) {
              onChange('province', p);
            }
          }
        })
        .catch(err => console.warn('Failed to auto-detect province:', err));
    }
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
    </>
  );
}

function StepPreference({ data, onChange }) {
  const addCity = (city) => {
    const current = data.target_city || '';
    if (!current.includes(city)) {
      onChange('target_city', current ? `${current}、${city}` : city);
    }
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
              onClick={() => addCity(city)}
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
          {['985', '211', '双一流', '公办优先', '无特殊偏好'].map(pref => (
            <button key={pref} type="button" className={`chip ${data.school_preference === pref ? 'selected' : ''}`} onClick={() => onChange('school_preference', pref)}>
              {pref}
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">是否优先留在本省</label>
        <div className="option-group">
          {[{ v: true, l: '是，优先本省' }, { v: false, l: '不一定' }].map(opt => (
            <label key={String(opt.v)} className={`option-item ${data.prefer_home_province === opt.v ? 'selected' : ''}`}>
              <input type="radio" checked={data.prefer_home_province === opt.v} onChange={() => onChange('prefer_home_province', opt.v)} />
              <span className="option-dot" />
              <span className="option-text">{opt.l}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

function SortableItem({ id, idx }) {
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
        <p style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: 12 }}>按住右侧图标拖拽调整顺序，排在前面优先级更高</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pathPriority} strategy={verticalListSortingStrategy}>
            <div className="sortable-list">
              {pathPriority.map((item, idx) => (
                <SortableItem key={item} id={item} idx={idx} />
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

const STEP_COMPONENTS = [StepBasic, StepPreference, StepFamily, StepStudent];

export default function FormPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
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

  const validateStep = () => {
    if (step === 0) {
      if (!formData.province) return '请选择省份';
      if (!formData.score) return '请输入分数';
      if (!formData.rank) return '请输入位次';
      if (!formData.subject_type) return '请选择科类';
      if (formData.accept_adjustment === undefined) return '请选择是否服从调剂';
    }
    if (step === 2) {
      if (!formData.decision_maker) return '请选择谁主导决策';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    if (step < FORM_STEPS.length - 1) {
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
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失败');
      router.push(`/report/${data.reportId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const StepComponent = STEP_COMPONENTS[step];
  const isLastStep = step === FORM_STEPS.length - 1;
  const progress = ((step + 1) / FORM_STEPS.length) * 100;
  const helperText = [
    '先确认基础分数信息，我们会据此建立你的定位。',
    '地域和院校偏好会直接影响推荐边界与筛选顺序。',
    '把家庭决策逻辑说清楚，报告会更贴近真实讨论场景。',
    '最后补充学生画像，让推荐更像“为你做的”而不是模板。',
  ];
  const loadingItems = [
    '采集信息完成',
    '构建考生画像',
    '生成差异化方案',
    '复核输出质量',
  ];

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
          <div className="loading-text">正在为你生成志愿分析报告</div>
          <div className="loading-subtext">AI 正在综合分析你的分数、偏好和路径匹配度…</div>
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
            {FORM_STEPS.map((_, i) => (
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
          <div className={`step-wrapper step-${direction}`} key={stepKey}>
            <div className="form-step-header">
              <div className="form-step-icon">{FORM_STEPS[step].icon}</div>
              <div className="form-step-text">
                <span className="form-step-kicker">第 {step + 1} / {FORM_STEPS.length} 步</span>
                <h2>{FORM_STEPS[step].title}</h2>
                <p>{FORM_STEPS[step].description}</p>
              </div>
            </div>

            <div className="form-step-hint">
              <span className="form-step-hint-dot" />
              <span>{helperText[step]}</span>
            </div>

            <StepComponent data={formData} onChange={handleChange} />

            {error && <div className="error-toast">{error}</div>}
          </div>
        </div>
      </div>

      <div className="form-nav">
        {step > 0 && (
          <button className="btn btn-back" onClick={handleBack}>← 上一步</button>
        )}
        {isLastStep ? (
          <button className="btn btn-submit" onClick={handleSubmit}>🎓 生成志愿报告</button>
        ) : (
          <button className="btn btn-next" onClick={handleNext}>下一步 →</button>
        )}
      </div>
    </div>
  );
}
