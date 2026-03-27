const PROVINCES = [
  '北京', '天津', '河北', '山西', '内蒙古',
  '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏',
  '陕西', '甘肃', '青海', '宁夏', '新疆',
];

export function normalizeProvinceName(value) {
  if (!value) {
    return null;
  }

  let province = value.replace(/省|市|维吾尔自治区|回族自治区|壮族自治区|自治区|特别行政区/g, '');

  if (province === '黑龙') {
    province = '黑龙江';
  }

  if (province === '内蒙') {
    province = '内蒙古';
  }

  return PROVINCES.includes(province) ? province : null;
}

export async function detectProvinceFromIpService(dependencies = {}) {
  const {
    fetchImpl = fetch,
    decodeText = (buffer) => new TextDecoder('gbk').decode(buffer),
  } = dependencies;

  try {
    const response = await fetchImpl('https://whois.pconline.com.cn/ipJson.jsp?json=true', {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    const payload = JSON.parse(decodeText(buffer));
    return normalizeProvinceName(payload?.pro);
  } catch {
    return null;
  }
}
