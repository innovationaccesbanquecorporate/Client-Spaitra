// Helpers
const $ = (id) => document.getElementById(id);

function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }

// Tel Madagascar: +261(32/33/34/38)XXXXXXX ou 0(32/33/34/38)XXXXXXX
function isTel(v){
  const s = v.replace(/\s+/g,'').trim();
  return /^(\+261|0)(32|33|34|38)\d{7}$/.test(s);
}

function toast(type, msg){
  const t = $("toast");
  t.className = "toast " + (type === "ok" ? "ok" : "err");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(()=> t.classList.add("hidden"), 4500);
}

// ---- Stepper / Panels ----
let currentStep = 1;
const steps = Array.from(document.querySelectorAll(".step"));
const panels = Array.from(document.querySelectorAll(".panel"));

function setStep(n){
  currentStep = n;
  steps.forEach(s => s.classList.toggle("active", Number(s.dataset.step) === n));
  panels.forEach(p => p.classList.toggle("hidden", Number(p.dataset.panel) !== n));

  const stepper = document.querySelector(".stepper");
  if(stepper) stepper.setAttribute("aria-valuenow", String(n));
}
setStep(1);

// ---- Type demande (radios) + blocs ----
const radios = Array.from(document.querySelectorAll('input[name="type"]'));
const blocRDV = $("blocRDV");
const blocRec = $("blocRec");

function getType(){
  const r = radios.find(x => x.checked);
  return r ? r.value : "";
}

function onTypeChange(){
  const v = getType();
  blocRDV.classList.toggle("hidden", v !== "rdv");
  blocRec.classList.toggle("hidden", v !== "reclamation");
  validateStep2();
}
radios.forEach(r => r.addEventListener("change", onTypeChange));

// ---- Message counter ----
const msg = $("message");
const count = $("count");
msg.addEventListener("input", () => {
  count.textContent = `${msg.value.length}/800`;
  validateStep2();
});

// ---- Live validation email/tel ----
const email = $("email");
const tel = $("tel");
const emailHint = $("emailHint");
const telHint = $("telHint");

email.addEventListener("input", ()=>{
  if(!email.value) { emailHint.textContent=""; emailHint.className="hint"; validateStep1(); return; }
  const ok = isEmail(email.value);
  emailHint.textContent = ok ? "Email valide" : "Format email incorrect";
  emailHint.className = "hint " + (ok ? "good" : "bad");
  validateStep1();
});

tel.addEventListener("input", ()=>{
  if(!tel.value) { telHint.textContent=""; telHint.className="hint"; validateStep1(); return; }
  const ok = isTel(tel.value);
  telHint.textContent = ok ? "Téléphone valide" : "Format attendu : +26134xxxxxxx ou 034xxxxxxx";
  telHint.className = "hint " + (ok ? "good" : "bad");
  validateStep1();
});

// ---- Step 1 validation ----
["prenom","nom"].forEach(id=>{
  const el = $(id);
  el.addEventListener("input", validateStep1);
  el.addEventListener("change", validateStep1);
});

function validateStep1(){
  const ok =
    $("prenom").value.trim().length > 0 &&
    $("nom").value.trim().length > 0 &&
    isEmail(email.value) &&
    isTel(tel.value);

  $("next1").disabled = !ok;
  return ok;
}
validateStep1();

// ---- Step 2 validation ----
["rdv1","motifRdv","produit","urgence"].forEach(id=>{
  const el = $(id);
  if(!el) return;
  el.addEventListener("input", validateStep2);
  el.addEventListener("change", validateStep2);
});

function validateStep2(){
  const type = getType();

  const baseOk =
    !!type &&
    msg.value.trim().length >= 10;

  let extraOk = true;
  if(type === "rdv"){
    extraOk = $("rdv1").value && $("motifRdv").value;
  } else if(type === "reclamation"){
    extraOk = $("produit").value && $("urgence").value;
  }

  const ok = baseOk && extraOk;

  $("next2").disabled = !ok;

  const st = $("status");
  if(!type) st.textContent = "En attente";
  else st.textContent = ok ? "Prêt à continuer" : "Champs incomplets";

  return ok;
}
validateStep2();

// ---- Navigation buttons ----
$("next1").addEventListener("click", ()=>{
  if(!validateStep1()) return;
  setStep(2);
});

$("back2").addEventListener("click", ()=> setStep(1));

$("next2").addEventListener("click", ()=>{
  if(!validateStep2()) return;
  fillSummary();
  setStep(3);
  validateStep3();
});

$("back3").addEventListener("click", ()=> setStep(2));

// ---- Summary ----
function fillSummary(){
  const fullName = `${$("prenom").value.trim()} ${$("nom").value.trim()}`.trim();
  $("sumNom").textContent = fullName || "—";
  $("sumContact").textContent = `${email.value.trim()} • ${tel.value.trim()}`;

  const type = getType();
  const typeLabel =
    type === "rdv" ? "Rendez-vous" :
    type === "reclamation" ? "Réclamation" :
    type === "info" ? "Information" :
    type === "autre" ? "Autre" : "—";

  $("sumType").textContent = typeLabel;

  let details = "";
  if(type === "rdv"){
    const d1 = $("rdv1").value ? `Choix 1: ${$("rdv1").value}` : "";
    const d2 = $("rdv2") && $("rdv2").value ? ` | Choix 2: ${$("rdv2").value}` : "";
    const m = $("motifRdv").value ? ` | Motif: ${$("motifRdv").value}` : "";
    details = (d1 + d2 + m).trim() || "—";
  } else if(type === "reclamation"){
    const p = $("produit").value ? `Produit: ${$("produit").value}` : "";
    const u = $("urgence").value ? ` | Urgence: ${$("urgence").value}` : "";
    const r = $("ref").value ? ` | Réf: ${$("ref").value}` : "";
    details = (p + u + r).trim() || "—";
  } else {
    details = "—";
  }

  $("sumDetails").textContent = details;
}

// ---- Step 3 validation ----
$("human").addEventListener("change", validateStep3);

function validateStep3(){
  const ok = $("human").checked;
  $("send").disabled = !ok;
  return ok;
}
validateStep3();

// ---- Submit (démo statique) ----
$("send").addEventListener("click", ()=>{
  if(!$("human").checked) return;
  toast("ok", "Demande prête. Étape suivante : connecter une base (Google Sheets / Supabase) pour enregistrer et générer un numéro de ticket premium.");
});

// ---- Background animation (subtle) ----
const canvas = $("bg");
const ctx = canvas.getContext("2d");
let w, h, dpr;

function resize(){
  dpr = Math.max(1, window.devicePixelRatio || 1);
  w = canvas.width = Math.floor(window.innerWidth * dpr);
  h = canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
}
window.addEventListener("resize", resize);
resize();

// Subtil = moins de points, vitesse plus lente, alpha plus faible
const N = 38;
const pts = Array.from({length:N}, ()=> ({
  x: Math.random()*w,
  y: Math.random()*h,
  vx: (Math.random()*0.12+0.03) * (Math.random()<0.5?-1:1) * dpr,
  vy: (Math.random()*0.12+0.03) * (Math.random()<0.5?-1:1) * dpr,
  r: (Math.random()*1.2+0.6) * dpr,
  c: Math.random() > 0.6 ? "white" : "sky"
}));

function step(){
  ctx.clearRect(0,0,w,h);

  // voile très léger (évite un “fond qui bouge trop”)
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  ctx.fillRect(0,0,w,h);

  // points
  for(const p of pts){
    p.x += p.vx; p.y += p.vy;
    if(p.x<0||p.x>w) p.vx*=-1;
    if(p.y<0||p.y>h) p.vy*=-1;

    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle = p.c === "white"
      ? "rgba(255,255,255,0.18)"
      : "rgba(124,198,255,0.20)";
    ctx.fill();
  }

  // liens discrets
  for(let i=0;i<N;i++){
    for(let j=i+1;j<N;j++){
      const a=pts[i], b=pts[j];
      const dx=a.x-b.x, dy=a.y-b.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      const max = 160*dpr;

      if(dist < max){
        const alpha = (1 - dist/max) * 0.10;
        ctx.strokeStyle = `rgba(124,198,255,${alpha})`;
        ctx.lineWidth = 1*dpr;
        ctx.beginPath();
        ctx.moveTo(a.x,a.y);
        ctx.lineTo(b.x,b.y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(step);
}
step();
