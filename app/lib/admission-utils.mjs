function toNumber(value) {
  const digits = String(value || '').replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

function uniqueNumbers(values = []) {
  return [...new Set(values.filter((value) => Number.isFinite(value) && value > 0))];
}

function extractRankNumbers(text = '') {
  const matches = [];
  const patterns = [
    /(?:最低位次|录取位次|投档位次|位次最低|最低排位|最低排名|最低名次)(?:为|是|在)?[^\d]{0,4}(\d{3,7})(?!年)/g,
    /(?:录取最低位次|最低录取位次)(?:为|是|在)?[^\d]{0,4}(\d{3,7})(?!年)/g,
  ];

  patterns.forEach((pattern) => {
    for (const match of text.matchAll(pattern)) {
      matches.push(Number(match[1]));
    }
  });

  return uniqueNumbers(matches);
}

function extractScoreNumbers(text = '') {
  const matches = [];
  const patterns = [
    /(?:最低分|录取最低分|投档分|分数线)[^\d]{0,8}(\d{3})/g,
    /(\d{3})分/g,
  ];

  patterns.forEach((pattern) => {
    for (const match of text.matchAll(pattern)) {
      matches.push(Number(match[1]));
    }
  });

  return uniqueNumbers(matches.filter((score) => score >= 200 && score <= 750));
}

function extractYear(text = '') {
  const match = text.match(/(20\d{2})/);
  return match ? Number(match[1]) : null;
}

function collectPlanBenchmarks(plan, searchResults = []) {
  const school = plan?.school || '';
  const major = plan?.major || '';
  const benchmarks = [];

  searchResults.forEach((result) => {
    (result?.results || []).forEach((item) => {
      const text = `${item?.title || ''} ${item?.content || ''}`;

      if (!school || !text.includes(school)) {
        return;
      }

      if (major && !text.includes(major)) {
        return;
      }

      const year = extractYear(text);
      const ranks = extractRankNumbers(text);
      const scores = extractScoreNumbers(text);

      if (ranks.length === 0 && scores.length === 0) {
        return;
      }

      benchmarks.push({
        year,
        ranks,
        scores,
      });
    });
  });

  return benchmarks;
}

function median(values = []) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
    : sorted[middle];
}

function getFallbackAdmissionRate(planType = '') {
  if (planType === '冲刺') {
    return '中低';
  }

  if (planType === '稳妥') {
    return '中高';
  }

  if (planType === '保底') {
    return '高';
  }

  return '中';
}

function classifyFromRank(userRank, benchmarkRank) {
  const ratio = userRank / benchmarkRank;

  if (ratio <= 0.88) {
    return '高';
  }

  if (ratio <= 0.99) {
    return '中高';
  }

  if (ratio <= 1.05) {
    return '中';
  }

  if (ratio <= 1.15) {
    return '中低';
  }

  return '低';
}

function classifyFromScore(userScore, benchmarkScore) {
  const gap = userScore - benchmarkScore;

  if (gap >= 15) {
    return '高';
  }

  if (gap >= 6) {
    return '中高';
  }

  if (gap >= -4) {
    return '中';
  }

  if (gap >= -12) {
    return '中低';
  }

  return '低';
}

export function inferAdmissionRate(formData, plan, searchResults = []) {
  const userRank = toNumber(formData?.rank);
  const userScore = toNumber(formData?.score);
  const benchmarks = collectPlanBenchmarks(plan, searchResults);

  const rankBenchmarks = uniqueNumbers(benchmarks.flatMap((entry) => entry.ranks));
  const scoreBenchmarks = uniqueNumbers(benchmarks.flatMap((entry) => entry.scores));

  if (userRank && rankBenchmarks.length > 0) {
    return classifyFromRank(userRank, median(rankBenchmarks));
  }

  if (userScore && scoreBenchmarks.length > 0) {
    return classifyFromScore(userScore, median(scoreBenchmarks));
  }

  return getFallbackAdmissionRate(plan?.type);
}

export function enrichAdmissionRates(formData, report, searchResults = []) {
  if (!report || !Array.isArray(report.plans)) {
    return report;
  }

  return {
    ...report,
    plans: report.plans.map((plan) => {
      const hasNeedsReviewText = /需历史数据复核|待核验|待复核/.test(String(plan?.admission_rate || ''));
      const normalizedAdmissionRate = hasNeedsReviewText || !plan?.admission_rate
        ? inferAdmissionRate(formData, plan, searchResults)
        : plan.admission_rate;

      return {
        ...plan,
        admission_rate: normalizedAdmissionRate,
      };
    }),
  };
}
