const { search } = require('duck-duck-scrape');
async function test() {
  const result = await search('杭州电子科技大学 2023 陕西 录取位次');
  console.log(JSON.stringify(result.results.slice(0, 3), null, 2));
}
test();
