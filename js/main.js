// 加载当天简报数据
async function loadBriefing() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 更新日期显示
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  document.getElementById('currentDate').textContent = today.toLocaleDateString('zh-CN', options);
  
  try {
    // 尝试加载当天数据
    const response = await fetch(`data/${dateStr}.json`);
    if (!response.ok) throw new Error('No data for today');
    
    const data = await response.json();
    renderBriefing(data);
  } catch (e) {
    // 如果没有当天数据，显示示例
    renderSampleBriefing();
  }
}

// 渲染简报
function renderBriefing(data) {
  const container = document.getElementById('briefing');
  
  // 兼容两种数据格式
  const sections = data.sections || data;
  
  const sectionDefs = [
    { key: 'international', icon: '🌍', title: '国际' },
    { key: 'domestic', icon: '🇨🇳', title: '国内' },
    { key: 'tech', icon: '💻', title: '科技' },
    { key: 'hot', icon: '🔥', title: '热梗' },
    { key: 'knowledge', icon: '📚', title: '新知' },
    { key: 'finance', icon: '💰', title: '财经' },
  ];
  
  let html = `<div class="read-time">约${estimateReadTime(sections)}分钟读完</div>`;
  
  for (const def of sectionDefs) {
    const items = sections[def.key];
    if (!items || items.length === 0) continue;
    
    if (def.key === 'hot') {
      // 热梗用标签样式
      html += `
        <section class="section">
          <div class="section-title"><span class="icon">${def.icon}</span>${def.title}</div>
          <div class="hot-tags">
            ${items.map(item => {
              const term = typeof item === 'string' ? item : (item.term || item.title || '');
              const desc = typeof item === 'object' ? (item.desc || item.summary || '') : '';
              return desc ? `<span class="hot-tag" title="${desc}">${term}</span>` : `<span class="hot-tag">${term}</span>`;
            }).join('')}
          </div>
        </section>
      `;
    } else {
      // 普通新闻条目
      html += `
        <section class="section">
          <div class="section-title"><span class="icon">${def.icon}</span>${def.title}</div>
          ${items.map(item => `
            <div class="news-item">
              <div class="news-title">${item.title || item.term || ''}</div>
              <div class="news-summary">${item.summary || item.desc || ''}</div>
              ${item.source ? `<div class="news-source">来源：<a href="${item.url || '#'}" target="_blank">${item.source}</a></div>` : ''}
            </div>
          `).join('')}
        </section>
      `;
    }
  }
  
  container.innerHTML = html;
}

// 估算阅读时间
function estimateReadTime(sections) {
  let wordCount = 0;
  const textKeys = ['international', 'domestic', 'tech', 'knowledge', 'finance'];
  for (const key of textKeys) {
    if (sections[key]) {
      sections[key].forEach(item => {
        wordCount += ((item.title || '') + (item.summary || '')).length;
      });
    }
  }
  if (sections.hot) wordCount += sections.hot.length * 5;
  return Math.max(2, Math.ceil(wordCount / 400));
}

// 示例简报（无数据时显示）
function renderSampleBriefing() {
  const container = document.getElementById('briefing');
  container.innerHTML = `
    <section class="section">
      <div class="section-title"><span class="icon">🌍</span>国际</div>
      <div class="news-item">
        <div class="news-title">正在加载今日简报...</div>
        <div class="news-summary">明早 7:30 自动更新</div>
      </div>
    </section>
  `;
}

// 页面加载
document.addEventListener('DOMContentLoaded', loadBriefing);
