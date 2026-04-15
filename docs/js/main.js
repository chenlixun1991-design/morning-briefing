function formatDisplayDate(dateString) {
  const date = dateString ? new Date(`${dateString}T08:00:00`) : new Date();
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function getRequestedDate() {
  const params = new URLSearchParams(window.location.search);
  return params.get('date');
}

async function loadArchiveManifest() {
  const response = await fetch('data/archive.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Archive manifest not found');
  const list = await response.json();
  if (!Array.isArray(list) || list.length === 0) throw new Error('Archive manifest is empty');
  return list;
}

function normalizeSections(data) {
  const sections = { ...(data.sections || data) };

  if (!sections.domestic && sections.china) {
    sections.domestic = sections.china;
  }
  if (!sections.trending && sections.hot) {
    sections.trending = sections.hot;
  }
  if (!sections.trending && sections.trends) {
    sections.trending = sections.trends;
  }
  if (!sections.research && sections.knowledge) {
    sections.research = sections.knowledge;
  }

  return sections;
}

async function loadBriefing() {
  const currentDateEl = document.getElementById('currentDate');
  const requestedDate = getRequestedDate();

  try {
    const archive = await loadArchiveManifest();
    const targetDate = requestedDate || archive[0].date;
    currentDateEl.textContent = formatDisplayDate(targetDate);

    const response = await fetch(`data/${targetDate}.json`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`No data for ${targetDate}`);

    const data = await response.json();
    renderBriefing(data, targetDate, archive);
  } catch (error) {
    console.error('Failed to load briefing:', error);
    currentDateEl.textContent = formatDisplayDate(requestedDate);
    renderSampleBriefing(requestedDate);
  }
}

function renderBriefing(data, requestedDate, archive) {
  const container = document.getElementById('briefing');
  const sections = normalizeSections(data);
  const showingDate = requestedDate || data.date;
  const latestDate = Array.isArray(archive) && archive.length > 0 ? archive[0].date : showingDate;

  const sectionDefs = [
    { key: 'international', icon: '🌍', title: '国际', isHot: false },
    { key: 'domestic', icon: '🇨🇳', title: '国内', isHot: false },
    { key: 'tech', icon: '💻', title: '科技', isHot: false },
    { key: 'trending', icon: '🔥', title: '热梗', isHot: true },
    { key: 'research', icon: '📚', title: '新知', isHot: false },
    { key: 'finance', icon: '💰', title: '财经', isHot: false },
  ];

  let html = `<div class="read-time">约${estimateReadTime(sections)}分钟读完</div>`;

  if (showingDate && latestDate && showingDate !== latestDate) {
    html += `
      <section class="section">
        <div class="news-item">
          <div class="news-title">当前正在查看 ${showingDate} 的历史简报</div>
          <div class="news-summary"><a href="index.html">返回最新一期</a></div>
        </div>
      </section>
    `;
  }

  for (const def of sectionDefs) {
    const items = sections[def.key];
    if (!Array.isArray(items) || items.length === 0) continue;

    if (def.isHot) {
      html += `
        <section class="section">
          <div class="section-title"><span class="icon">${def.icon}</span>${def.title}</div>
          <div class="hot-tags">
            ${items.map(item => {
              const term = typeof item === 'string' ? item : (item.term || item.title || '');
              const desc = typeof item === 'object' ? (item.desc || item.summary || '') : '';
              if (desc) {
                return `<span class="hot-tag">${term}<span class="tooltip">${desc}</span></span>`;
              }
              return `<span class="hot-tag">${term}</span>`;
            }).join('')}
          </div>
        </section>
      `;
      continue;
    }

    html += `
      <section class="section">
        <div class="section-title"><span class="icon">${def.icon}</span>${def.title}</div>
        ${items.map(item => `
          <div class="news-item">
            <div class="news-title">${item.title || item.term || ''}</div>
            <div class="news-summary">${item.summary || item.desc || ''}</div>
            ${item.source ? `<div class="news-source">来源：<a href="${item.url || '#'}" target="_blank" rel="noopener noreferrer">${item.source}</a></div>` : ''}
          </div>
        `).join('')}
      </section>
    `;
  }

  container.innerHTML = html;
}

function estimateReadTime(sections) {
  let wordCount = 0;
  const textKeys = ['international', 'domestic', 'tech', 'research', 'finance'];
  for (const key of textKeys) {
    if (Array.isArray(sections[key])) {
      sections[key].forEach(item => {
        wordCount += ((item.title || '') + (item.summary || '')).length;
      });
    }
  }

  if (Array.isArray(sections.trending)) {
    wordCount += sections.trending.length * 5;
  }

  return Math.max(2, Math.ceil(wordCount / 400));
}

function renderSampleBriefing(requestedDate) {
  const container = document.getElementById('briefing');
  const title = requestedDate ? `未找到 ${requestedDate} 的简报` : '暂无可展示的简报';
  container.innerHTML = `
    <section class="section">
      <div class="section-title"><span class="icon">🍅</span>简报状态</div>
      <div class="news-item">
        <div class="news-title">${title}</div>
        <div class="news-summary">请确认 data/archive.json 和对应日期 JSON 已同步到 GitHub Pages。</div>
      </div>
    </section>
  `;
}

document.addEventListener('DOMContentLoaded', loadBriefing);
