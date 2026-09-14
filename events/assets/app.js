const DATA_URL='/data/events.json';
const DAY=86400000;
const fmt=d=>new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Seoul'}).format(new Date(d));
const STATUS_LABELS={
  watch:'观察中 / Watch',
  announced:'已公布 / Announced',
  registration_open:'报名开放 / Registration Open',
  registration_closing:'报名即将截止 / Registration Closing',
  upcoming:'即将举行 / Upcoming',
  ongoing:'进行中 / Ongoing',
  completed:'已结束 / Completed'
};
const labelStatus=s=>STATUS_LABELS[s]||s||'未知 / Unknown';
const statusClass=s=>s==='registration_open'||s==='registration_closing'?'open':s==='completed'?'completed':'';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const hasHangul=s=>/[\u3131-\u318E\uAC00-\uD7A3]/.test(String(s||''));
const eventHref=e=>`/event/${encodeURIComponent(e.id)}`;

// Known translations for agenda items that were originally captured from Korean official pages.
const KO_AGENDA_TRANSLATIONS={
  '6G 시대를 대비하는 Network AI 추진 방향':{
    zh:'面向 6G 时代的 Network AI 推进方向',
    en:'Network AI Strategy for the 6G Era'
  },
  'AI 기반 Autonomous Network 진화':{
    zh:'基于 AI 的自治网络演进',
    en:'Evolution toward AI-based Autonomous Networks'
  }
};

function primaryTitle(e){return e.titleZh||e.title||'未命名活动';}
function secondaryTitle(e){
  const en=e.title||'';
  const zh=e.titleZh||'';
  return en&&en!==zh?en:'';
}
function agendaTitles(a){
  const known=KO_AGENDA_TRANSLATIONS[a.title]||null;
  const zh=a.titleZh||known?.zh||(!hasHangul(a.title)?a.title:'议程标题待翻译，请参考官方来源');
  const en=a.titleEn||known?.en||(!hasHangul(a.title)?a.title:'');
  return {zh,en:en&&en!==zh?en:''};
}
function bilingualTitleHtml(e,tag='div',cls='event-title'){
  const sub=secondaryTitle(e);
  return `<${tag} class="${cls}">${esc(primaryTitle(e))}</${tag}>${sub?`<div class="muted" style="margin-top:4px">${esc(sub)}</div>`:''}`;
}
function badges(e){
  return [
    `<span class="badge ${String(e.priority||'').toLowerCase()}">${esc(e.priority||'—')}</span>`,
    `<span class="badge ${statusClass(e.status)}">${esc(labelStatus(e.status))}</span>`,
    ...(e.insights?.length?[`<span class="badge insight">已有洞察 / Insight Available</span>`]:[])
  ].join('');
}
function card(e){
  return `<a class="event-card" href="${eventHref(e)}">
    <div class="event-top"><div>
      <div class="event-date">${esc(e.startDate||'TBD')}${e.endDate&&e.endDate!==e.startDate?` — ${esc(e.endDate)}`:''}</div>
      ${bilingualTitleHtml(e)}
      <div class="event-org">${esc((e.organizer||[]).join(' · '))}</div>
    </div><div>${badges(e)}</div></div>
    <div class="event-summary">${esc(e.summary||'')}</div>
    <div class="event-meta">${(e.topics||[]).slice(0,5).map(t=>`<span class="badge">${esc(t)}</span>`).join('')}</div>
    <div class="event-location">${esc(e.location||'地点待公布 / Location TBD')}</div>
  </a>`;
}
async function load(){
  const r=await fetch(DATA_URL,{cache:'no-store'});
  if(!r.ok)throw new Error('无法加载活动数据 / Unable to load events');
  return r.json();
}
function classify(events){
  const now=Date.now();
  return {
    future:events.filter(e=>new Date(e.endDate||e.startDate).getTime()>=now-DAY),
    past:events.filter(e=>new Date(e.endDate||e.startDate).getTime()<now-DAY)
  };
}
function initHome(data){
  const all=[...(data.events||[])].sort((a,b)=>String(a.startDate).localeCompare(String(b.startDate)));
  const {future}=classify(all);
  const meta=document.querySelector('#updated');
  if(meta)meta.textContent=`更新于 / Last updated · ${fmt(data.updatedAt||Date.now())}`;
  const stats=document.querySelector('#stats');
  if(stats){
    const open=future.filter(e=>['registration_open','registration_closing'].includes(e.status)).length;
    const high=future.filter(e=>['S','A'].includes(e.priority)).length;
    const physical=future.filter(e=>(e.topics||[]).some(t=>/physical|robot|embodied/i.test(t))).length;
    stats.innerHTML=`<div class="stat"><strong>${future.length}</strong><span class="muted">未来/进行中 · Active & upcoming</span></div><div class="stat"><strong>${open}</strong><span class="muted">可报名 · Open registration</span></div><div class="stat"><strong>${high}</strong><span class="muted">S / A 高优先级</span></div><div class="stat"><strong>${physical}</strong><span class="muted">Physical AI / Robotics</span></div>`;
  }
  const closing=future.filter(e=>e.registrationDeadline&&['registration_open','registration_closing'].includes(e.status)).sort((a,b)=>String(a.registrationDeadline).localeCompare(String(b.registrationDeadline))).slice(0,6);
  const alerts=document.querySelector('#closing');
  if(alerts)alerts.innerHTML=closing.length?closing.map(e=>`<a class="alert-item" href="${eventHref(e)}"><strong>${esc(e.registrationDeadline)}</strong><span>${esc(primaryTitle(e))}${secondaryTitle(e)?`<br><span class="muted">${esc(secondaryTitle(e))}</span>`:''}</span><span class="muted">${esc(labelStatus(e.status))} →</span></a>`).join(''):'<div class="empty">当前没有已确认的报名截止提醒。/ No confirmed registration deadlines.</div>';
  const high=future.filter(e=>['S','A'].includes(e.priority)).slice(0,6);
  const highlights=document.querySelector('#highlights');
  if(highlights)highlights.innerHTML=high.length?high.map(card).join(''):'<div class="empty">暂无 S/A 级活动。/ No S/A events yet.</div>';
  const list=document.querySelector('#events');
  let filter='All';
  const chips=[...document.querySelectorAll('[data-filter]')];
  function draw(){
    const filtered=future.filter(e=>filter==='All'||(e.topics||[]).some(t=>t.toLowerCase().includes(filter.toLowerCase())));
    if(list)list.innerHTML=filtered.length?filtered.map(card).join(''):'<div class="empty">该分类暂无活动。/ No events in this category.</div>';
  }
  chips.forEach(c=>c.onclick=()=>{filter=c.dataset.filter;chips.forEach(x=>x.classList.toggle('active',x===c));draw();});
  draw();
}
function initArchive(data){
  const events=[...(data.events||[])].filter(e=>e.status==='completed'||new Date(e.endDate||e.startDate)<new Date()).sort((a,b)=>String(b.startDate).localeCompare(String(a.startDate)));
  const el=document.querySelector('#archive');
  if(!el)return;
  el.innerHTML=events.length?events.map(e=>`<a class="archive-item" href="${eventHref(e)}"><span class="timeline-date">${esc(e.startDate||'')}</span><span><strong>${esc(primaryTitle(e))}</strong>${secondaryTitle(e)?`<br><span class="muted">${esc(secondaryTitle(e))}</span>`:''}<br><span class="muted">${esc((e.organizer||[]).join(' · '))}</span></span><span>${e.insights?.length?'<span class="badge insight">已有洞察 / Insight Available</span>':'<span class="muted">已结束 / Completed →</span>'}</span></a>`).join(''):'<div class="empty">历史归档将在活动结束后自动累积。/ Completed events will appear here.</div>';
}
function initInsights(data){
  const rows=(data.events||[]).flatMap(e=>(e.insights||[]).map(i=>({...i,event:e}))).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  const el=document.querySelector('#insights');
  if(!el)return;
  el.innerHTML=rows.length?rows.map(x=>`<div class="insight-item"><div class="timeline-date">${esc(x.date||'')}</div><h3>${esc(x.title)}</h3><div class="muted">关联活动 / Related event: <a href="${eventHref(x.event)}">${esc(primaryTitle(x.event))}</a></div>${x.url?`<p><a href="${esc(x.url)}">阅读洞察 / Read insight →</a></p>`:''}</div>`).join(''):'<div class="empty">关键活动结束后，技术总结与验证洞察会持续沉淀到这里。/ Post-event insights will appear here.</div>';
}
function currentSlug(){
  const p=location.pathname.split('/').filter(Boolean);
  return p[p.length-1]==='event'?'':decodeURIComponent(p[p.length-1]||'');
}
function initDetail(data){
  const slug=currentSlug()||new URLSearchParams(location.search).get('id');
  const e=(data.events||[]).find(x=>x.id===slug);
  const root=document.querySelector('#detail');
  if(!root)return;
  if(!e){
    root.innerHTML='<section class="hero"><div class="eyebrow">EVENT NOT FOUND</div><h1>活动记录不存在</h1><p class="lede">The event record does not exist or has not been added yet.</p></section>';
    return;
  }
  document.title=`${primaryTitle(e)} · Korea Advanced Technology Events`;
  const agendaHtml=e.agenda?.length?`<div class="timeline">${e.agenda.map(a=>{const t=agendaTitles(a);return `<div class="timeline-item"><span class="timeline-date">${esc(a.time||'')}</span><span><strong>${esc(t.zh)}</strong>${t.en?`<br><span class="muted">${esc(t.en)}</span>`:''}${a.speaker?`<br><span class="muted">${esc(a.speaker)}</span>`:''}</span><span></span></div>`;}).join('')}</div>`:'<p class="muted">议程暂未公布。/ Agenda not yet published.</p>';
  root.innerHTML=`<section class="detail-hero"><div class="eyebrow">${esc((e.topics||[]).join(' · '))}</div><h1>${esc(primaryTitle(e))}</h1>${secondaryTitle(e)?`<p class="lede" style="margin-top:8px">${esc(secondaryTitle(e))}</p>`:''}<p class="lede">${esc(e.summary||'')}</p><div class="event-meta">${badges(e)}</div></section><section class="detail-grid"><div><div class="panel"><h2>为什么值得关注 / Why It Matters</h2><p>${esc(e.whyItMatters||'待补充。 / To be added.')}</p></div><div class="panel" style="margin-top:18px"><h2>议程与演讲 / Agenda & Speakers</h2>${agendaHtml}</div><div class="panel" style="margin-top:18px"><h2>会后洞察 / Post-event Insights</h2>${e.insights?.length?`<div class="insight-list">${e.insights.map(i=>`<div class="insight-item"><div class="timeline-date">${esc(i.date||'')}</div><h3>${esc(i.title)}</h3>${i.summary?`<p>${esc(i.summary)}</p>`:''}${i.url?`<a href="${esc(i.url)}">阅读洞察 / Read insight →</a>`:''}</div>`).join('')}</div>`:'<p class="muted">活动结束后将在这里持续沉淀技术洞察。/ Post-event insights will be added here.</p>'}</div></div><aside class="panel"><div class="facts"><div class="fact"><span class="fact-label">日期 / Date</span>${esc(e.startDate||'TBD')}${e.endDate&&e.endDate!==e.startDate?` — ${esc(e.endDate)}`:''}</div><div class="fact"><span class="fact-label">主办方 / Organizer</span>${esc((e.organizer||[]).join(' · ')||'TBD')}</div><div class="fact"><span class="fact-label">地点 / Location</span>${esc(e.location||'TBD')}</div><div class="fact"><span class="fact-label">报名 / Registration</span>${esc(labelStatus(e.status))}${e.registrationDeadline?` · ${esc(e.registrationDeadline)}`:''}</div><div class="fact"><span class="fact-label">资格 / Eligibility</span>${esc(e.registrationEligibility||'TBD')}</div><div class="fact"><span class="fact-label">活动语言 / Event language</span>${esc(e.language||'TBD')}</div></div><div class="actions" style="margin-top:18px">${e.registrationUrl?`<a class="button" href="${esc(e.registrationUrl)}">报名 / Register →</a>`:''}${e.officialUrl?`<a class="button secondary" href="${esc(e.officialUrl)}">官方来源 / Official source →</a>`:''}</div></aside></section>`;
}
load().then(data=>{
  const page=document.body.dataset.page;
  if(page==='home')initHome(data);
  if(page==='archive')initArchive(data);
  if(page==='insights')initInsights(data);
  if(page==='detail')initDetail(data);
}).catch(err=>{
  document.querySelector('main')?.insertAdjacentHTML('beforeend',`<div class="shell empty">${esc(err.message)}</div>`);
});