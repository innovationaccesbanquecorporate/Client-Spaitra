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

// Type demande (radios)
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
  validateAll();
}
radios.forEach(r => r.addEventListener("change", onTypeChange));

// Message counter
const msg = $("message");
const count = $("count");
msg.addEventListener("input", () => {
  count.textContent = `${msg.value.length}/800`;
  validateAll();
});

// Live validation email/tel
const email = $("email");
const tel = $("tel");
const emailHint = $("emailHint");
const telHint = $("telHint");

email.addEventListener("input", ()=>{
  if(!email.value) { emailHint.textContent=""; emailHint.className="hint"; validateAll(); return; }
  const ok = isEmail(email.value);
  emailHint.textContent = ok ? "Email valide" : "Format email incorrect";
  emailHint.className = "hint " + (ok ? "good" : "bad");
  validateAll();
});

tel.addEventListener("input", ()=>{
  if(!tel.value) { telHint.textContent=""; telHint.className="hint"; validateAll(); return; }
  const ok = isTel(tel.value);
  telHint.textContent = ok ? "Téléphone valide" : "Format attendu : +26134xxxxxxx ou 034xxxxxxx";
  telHint.className = "hint " + (ok ? "good" : "bad");
  validateAll();
});

// Other listeners
["prenom","nom","human","rdv1","motifRdv","produit","urgence"].forEach(id=>{
  const el = $(id);
  if(!el) return;
  el.addEventListener("change", validateAll);
  el.addEventListener("input", validateAll);
});

function validateAll(){
  const type = getType();

  const baseOk =
    $("prenom").value.trim() &&
    $("nom").value.trim() &&
    isEmail(email.value) &&
    isTel(tel.value) &&
    type &&
    msg.value.trim().length >= 10 &&
    $("human").checked;

  let extraOk = true;
  if(type === "rdv"){
    extraOk = $("rdv1").value && $("motifRdv").value;
  } else if(type === "reclamation"){
    extraOk = $("produit").value && $("urgence").value;
  }

  const ok = !!(baseOk && extraOk);
  $("send").disabled = !ok;

  const st = $("status");
  if(!type) st.textContent = "En attente";
  else st.textContent = ok ? "Prêt à envoyer" : "Champs incomplets";
}

// Submit (démo statique)
$("send").addEventListener("click", ()=>{
  toast("ok", "Formulaire valide. Prochaine étape : connecter à Google Sheets ou Supabase pour enregistrer et générer un numéro de ticket.");
});

validateAll();

// --- Fond animé clair (particules légères) ---
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

const N = 55;
const pts = Array.from({length:N}, ()=> ({
  x: Math.random()*w,
  y: Math.random()*h,
  vx: (Math.random()*0.22+0.05) * (Math.random()<0.5?-1:1) * dpr,
  vy: (Math.random()*0.22+0.05) * (Math.random()<0.5?-1:1) * dpr,
  r: (Math.random()*1.4+0.6) * dpr
}));

function step(){
  ctx.clearRect(0,0,w,h);

  // voile blanc très léger pour garder le fond clair
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillRect(0,0,w,h);

  // particules
  for(const p of pts){
    p.x += p.vx; p.y += p.vy;
    if(p.x<0||p.x>w) p.vx*=-1;
    if(p.y<0||p.y>h) p.vy*=-1;

    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle = "rgba(37,99,235,0.12)";
    ctx.fill();
  }

  // liens
  for(let i=0;i<N;i++){
    for(let j=i+1;j<N;j++){
      const a=pts[i], b=pts[j];
      const dx=a.x-b.x, dy=a.y-b.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist < 140*dpr){
        const alpha = (1 - dist/(140*dpr)) * 0.12;
        ctx.strokeStyle = `rgba(37,99,235,${alpha})`;
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
