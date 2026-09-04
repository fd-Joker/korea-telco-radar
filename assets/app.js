async function loadJson(url){
  const r=await fetch(url,{cache:"no-store"});
  if(!r.ok) throw new Error(`Failed to load ${url}`);
  return r.json();
}
function esc(s=""){
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
function badgeClass(v=""){
  if(v.includes("重大")) return "major";
  if(v.includes("关注")) return "watch";
  return "";
}
function renderTop5(el,items=[]){
  if(!el) return;
  el.innerHTML=items.map((x,i)=>`
    <article class="signal">
      <div class="signal-index">${String(i+1).padStart(2,"0")}</div>
      <div>
        <div class="signal-title">${esc(x.title||"Untitled")}</div>
        <div class="signal-summary">${esc(x.summary||"")}</div>
      </div>
      <div class="badge ${badgeClass(x.importance||"")}">${esc(x.importance||"")}</div>
    </article>`).join("");
}
function normalizeTrends(t){
  if(Array.isArray(t)) return t;
  return Object.entries(t||{}).map(([name,v])=>({name,...(typeof v==="string"?{summary:v}:v)}));
}
function renderTrends(el,trends){
  if(!el) return;
  el.innerHTML=normalizeTrends(trends).map(x=>`
    <article class="trend">
      <div class="trend-name">${esc(x.name||x.topic||"")}</div>
      <div class="trend-status">${esc(x.status||x.direction||"Active")}</div>
      <p>${esc(x.summary||x.change_vs_previous||"")}</p>
    </article>`).join("");
}
function flattenSections(data){
  const sections=[
    ["通信设备商",data.vendors],
    ["运营商",data.operators],
    ["AI 公司",data.ai_companies]
  ];
  return sections.map(([title,obj])=>{
    const items=Array.isArray(obj)?obj:Object.values(obj||{}).flat().filter(Boolean);
    if(!items.length) return "";
    return `<section><div class="section-head"><h2>${title}</h2></div><div class="card-grid">${
      items.map(x=>`<article class="card">
        <div class="card-meta">
          <span class="badge ${badgeClass(x.importance||"")}">${esc(x.importance||"")}</span>
          <span class="badge">${esc(x.topic||x.company_or_org||"")}</span>
        </div>
        <h3>${esc(x.title||"")}</h3>
        <p>${esc(x.summary||"")}</p>
        ${x.technical_significance?`<p><strong>技术意义：</strong>${esc(x.technical_significance)}</p>`:""}
        ${x.impact_for_korean_telco?`<p><strong>对韩国运营商：</strong>${esc(x.impact_for_korean_telco)}</p>`:""}
        ${x.source_url?`<a href="${esc(x.source_url)}" target="_blank" rel="noopener">原始来源 ↗</a>`:""}
      </article>`).join("")
    }</div></section>`;
  }).join("");
}
async function init(){
  try{
    const data=await loadJson("/data/latest.json");
    const reportPath=`/reports/${data.date}.html`;

    const meta=document.querySelector("#report-meta");
    if(meta) meta.textContent=`Latest brief · ${data.date || ""}`;
    const latestLink=document.querySelector("#latest-link");
    if(latestLink) latestLink.href=reportPath || "/latest.html";

    renderTop5(document.querySelector("#top5"),data.top5||[]);
    renderTrends(document.querySelector("#trends"),data.trends||{});

    const briefMeta=document.querySelector("#brief-meta");
    if(briefMeta) briefMeta.textContent=`${data.date||""} · Daily Intelligence Brief`;
    const title=document.querySelector("#brief-title");
    if(title && data.title) title.textContent=data.title;
    renderTop5(document.querySelector("#brief-top5"),data.top5||[]);
    renderTrends(document.querySelector("#brief-trends"),data.trends||{});

    const details=document.querySelector("#details");
    if(details) details.innerHTML=flattenSections(data);

    const timeline=document.querySelector("#timeline");
    if(timeline && Array.isArray(data.timeline15d) && data.timeline15d.length){
      timeline.innerHTML=`<section><div class="section-head"><h2>15-Day Intelligence Timeline</h2></div>
      <div class="timeline">${data.timeline15d.map(x=>`
        <div class="timeline-item">
          <div class="timeline-date">${esc(x.date||"")}</div>
          <strong>${esc(x.title||x.summary||"")}</strong>
          ${x.source_url?` · <a href="${esc(x.source_url)}" target="_blank" rel="noopener">source ↗</a>`:""}
        </div>`).join("")}</div></section>`;
    }
  }catch(e){
    console.error(e);
    document.querySelectorAll(".meta").forEach(x=>x.textContent="Latest report data is not available yet.");
  }
}
init();
