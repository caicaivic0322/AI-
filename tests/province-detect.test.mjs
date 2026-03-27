import test from 'node:test';
import assert from 'node:assert/strict';

import {
  detectProvinceFromIpService,
  normalizeProvinceName,
} from '../app/lib/province-detect.mjs';
import { handleDetectProvinceRequest } from '../app/lib/api/province-detect-handler.mjs';

async function readJson(response) {
  return response.json();
}

async function withMutedConsoleError(run) {
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    return await run();
  } finally {
    console.error = originalConsoleError;
  }
}

test('normalizes province names returned by ip service', () => {
  assert.equal(normalizeProvinceName('浙江省'), '浙江');
  assert.equal(normalizeProvinceName('黑龙江省'), '黑龙江');
  assert.equal(normalizeProvinceName('内蒙古自治区'), '内蒙古');
  assert.equal(normalizeProvinceName('北京市'), '北京');
});

test('returns detected province from upstream ip service payload', async () => {
  const province = await detectProvinceFromIpService({
    fetchImpl: async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
      }),
    decodeText: () => JSON.stringify({ pro: '浙江省' }),
  });

  assert.equal(province, '浙江');
});

test('returns null when upstream ip service fails', async () => {
  const province = await detectProvinceFromIpService({
    fetchImpl: async () => {
      throw new Error('network failed');
    },
  });

  assert.equal(province, null);
});

test('/api/geo/province returns detected province', async () => {
  const response = await handleDetectProvinceRequest(
    new Request('http://localhost:3000/api/geo/province'),
    {
      detectProvince: async () => '江苏',
    }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), { province: '江苏' });
});

test('/api/geo/province falls back to null province instead of 500', async () => {
  const response = await withMutedConsoleError(() =>
    handleDetectProvinceRequest(
      new Request('http://localhost:3000/api/geo/province'),
      {
        detectProvince: async () => {
          throw new Error('upstream failed');
        },
      }
    )
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), { province: null });
});
