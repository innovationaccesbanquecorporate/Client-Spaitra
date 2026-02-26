// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);

function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }

// Tel: accepte +261..., 034..., 033..., 032..., 038..., espaces autorisés
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

// ---------- Dynamic UI ----------
const categorie = $("categorie");
const blocRDV = $("blocRDV");
const blocRec = $("blocRec");

categorie.addEventListener("change", () => {
  const v = categorie.value;
  blocRDV.classList.toggle("hidden", v !== "rdv");
  blocRec.classList.toggle("hidden", v !== "reclamation");
  validateAll();
});

// Message counter
const msg = $("message");
const count = $("count");
msg.addEventListener("input", () => {
  count.textContent = `${msg.value.length}/800`;
  validateAll();
});

// Live validation
const email = $("email");
const tel = $("tel");
const emailHint = $("emailHint");
const telHint = $("telHint");

email.addEventListener("input", ()=>{
  if(!email.value) { emailHint.textContent=""; emailHint.className="hint"; return; }
  const ok = isEmail(email.value);
  emailHint.textContent = ok ? "Email valide" : "Format email incorrect";
  emailHint.className = "hint " + (ok ? "good" : "bad");
  validateAll();
});

tel.addEventListener("input", ()=>{
  if(!tel.value) { telHint.textContent=""; telHint.className="hint"; return; }
  const ok = isTel(tel.value);
  telHint.textContent = ok ? "Téléphone valide" : "Format attendu : +26134xxxxxxx ou 034xxxxxxx";
  telHint.className = "hint " + (ok ? "good" : "bad");
  validateAll();
});

["prenom","nom","agence","human","rdv1","motifRdv","produit","urgence"].forEach(id=>{
  const el = $(id);
  if(el) el.addEventListener("change", validateAll);
  if(el && el.tagName === "INPUT") el.addEventListener("input", validateAll);
});

function validateAll(){
  const baseOk =
    $("prenom").value.trim() &&
    $("nom").value.trim() &&
    isEmail(email.value) &&
    isTel(tel.value) &&
    $("agence").value &&
    categorie.value &&
    msg.value.trim().length >= 10 &&
    $("human").checked;

  let extraOk = true;

  if(categorie.value === "rdv"){
    extraOk = $("rdv1").value && $("motifRdv").value;
  } else if(categorie.value === "reclamation"){
    extraOk = $("produit").value && $("urgence").value;
  }

  const ok = !!(baseOk && extraOk);

  $("send").disabled = !ok;

  const st = $("status");
  if(!categorie.value) { st.textContent = "En attente"; return; }
  st.textContent = ok ? "Prêt à envoyer" : "Champs incomplets";
}

// Fake submit (statique)
$("send").addEventListener("click", ()=>{
  toast("ok", "Message préparé. Prochaine étape : connecter à une base (Sheets/Supabase) pour enregistrer et générer un ticket.");
});

// init
validateAll();

// ---------- Animated background (lightweight particles) ----------
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

const N = 70;
const pts = Array.from({length:N}, ()=> ({
  x: Math.random()*w, y: Math.random()*h,
  vx: (Math.random()*0.35+0.08) * (Math.random()<0.5?-1:1) * dpr,
  vy: (Math.random()*0.35+0.08) * (Math.random()<0.5?-1:1) * dpr,
  r: (Math.random()*1.6+0.6) * dpr
}));

function step(){
  ctx.clearRect(0,0,w,h);

  // soft glow gradient overlay
  const g = ctx.createRadialGradient(w*0.2,h*0.15,0,w*0.2,h*0.15,Math.max(w,h)*0.7);
  g.addColorStop(0,"rgba(37,99,235,0.10)");
  g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g;
  ctx.fillRect(0,0,w,h);

  for(const p of pts){
    p.x += p.vx; p.y += p.vy;
    if(p.x<0||p.x>w) p.vx*=-1;
    if(p.y<0||p.y>h) p.vy*=-1;

    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle="rgba(255,255,255,0.20)";
    ctx.fill();
  }

  // links
  for(let i=0;i<N;i++){
    for(let j=i+1;j<N;j++){
      const a=pts[i], b=pts[j];
      const dx=a.x-b.x, dy=a.y-b.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<140*dpr){
        const alpha = (1 - dist/(140*dpr)) * 0.10;
        ctx.strokeStyle = `rgba(96,165,250,${alpha})`;
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
