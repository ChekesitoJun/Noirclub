const defaults={name:"Noir Club MX",eyebrow:"NOIR CLUB MX",title:"Productos buenos.|Precios mejores.",description:"Compramos a mayoreo para ofrecer productos a precios competitivos.",button:"Ver productos",aboutTitle:"Compra a buen precio. Revende con margen.",aboutText:"Somos un negocio de reventa: conseguimos productos a mayoreo y seleccionamos piezas para ofrecerlas a nuestros clientes.",instagram:"",tiktok:"",facebook:"",whatsapp1:"",whatsapp2:"",logo:"",heroImage:"",accent:"#f5f5f5",background:"#080808"};
const starterCats=[{id:"caps",name:"Gorras",description:"Gorras disponibles para entrega.",visible:true}];

let settings={...defaults};
let categories=[...starterCats];
let products=[];
let isAdmin=false;

const $=s=>document.querySelector(s), money=n=>new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0}).format(n);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const getImages=p=>Array.isArray(p.images)&&p.images.length?p.images:(p.image?[p.image]:[]);

// ---- Data loading ----
async function loadCatalog(){
  try{
    const res=await fetch("/api/catalog",{cache:"no-store"});
    if(!res.ok)throw new Error("bad response");
    const data=await res.json();
    settings={...defaults,...(data.settings||{})};
    categories=Array.isArray(data.categories)&&data.categories.length?data.categories:[];
    products=Array.isArray(data.products)?data.products:[];
  }catch(e){
    console.log("[v0] Error cargando catálogo:",e.message);
  }
  render();
}

// ---- Server save (admin only, debounced) ----
let saveTimer=null,saveStatusTimer=null;
function setSaveStatus(text,cls){const el=$("#saveStatus");if(!el)return;el.textContent=text;el.className="save-status "+(cls||"");}
function scheduleSave(){
  if(!isAdmin)return;
  setSaveStatus("Guardando…","saving");
  clearTimeout(saveTimer);
  saveTimer=setTimeout(saveCatalog,600);
}
async function saveCatalog(){
  try{
    const res=await fetch("/api/admin/catalog",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({settings,categories,products})});
    if(res.status===401){isAdmin=false;alert("Tu sesión expiró. Vuelve a iniciar sesión.");location.reload();return;}
    if(!res.ok)throw new Error("save failed");
    setSaveStatus("Guardado ✓","saved");
    clearTimeout(saveStatusTimer);
    saveStatusTimer=setTimeout(()=>setSaveStatus("",""),2000);
  }catch(e){
    console.log("[v0] Error guardando:",e.message);
    setSaveStatus("Error al guardar","error");
  }
}
function persist(){render();renderAdminProducts();renderAdminCategories();scheduleSave();}
async function uploadCatalogImage(file){
  const formData=new FormData();
  formData.append("file",file);
  const res=await fetch("/api/admin/catalog/upload",{method:"POST",body:formData});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.error||"No se pudo subir la imagen");
  return data.url;
}

// ---- Public rendering ----
function render(){
 document.documentElement.style.setProperty("--accent",settings.accent);document.documentElement.style.setProperty("--bg",settings.background);
 $("#brandText").textContent=settings.name;if(settings.logo){$("#logoImg").src=settings.logo;$("#logoImg").classList.remove("hidden");$("#brandText").classList.add("hidden")}else{$("#logoImg").classList.add("hidden");$("#brandText").classList.remove("hidden")}
 $("#heroEyebrow").textContent=settings.eyebrow;$("#heroTitle").innerHTML=esc(settings.title).replace("|","<br><em>")+"</em>";$("#heroDesc").textContent=settings.description;$("#heroButton").textContent=settings.button;$("#aboutTitle").textContent=settings.aboutTitle;$("#aboutText").textContent=settings.aboutText;$("#footerName").textContent=`© 2026 ${settings.name}`;
 if(settings.heroImage){$("#heroImage").src=settings.heroImage;$("#heroImage").classList.remove("hidden");$("#heroFallback").classList.add("hidden")}else{$("#heroImage").classList.add("hidden");$("#heroFallback").classList.remove("hidden")}
 setLink("#igLink",settings.instagram);setLink("#igFooter",settings.instagram);setLink("#ttLink",settings.tiktok);setLink("#ttFooter",settings.tiktok);setLink("#fbFooter",settings.facebook);setLink("#wa1Footer",settings.whatsapp1?`https://wa.me/${settings.whatsapp1}`:"");setLink("#wa2Footer",settings.whatsapp2?`https://wa.me/${settings.whatsapp2}`:"");
 $("#count").textContent=`${products.length} productos`;
 $("#categories").innerHTML=categories.map(cat=>{
   const list=products.filter(p=>p.category===cat.id);
   if(!cat.visible)return `<div><div class="category-head"><div><h3>${esc(cat.name)}</h3><p>${esc(cat.description||"")}</p></div><span class="category-status locked">PRÓXIMAMENTE</span></div><div class="locked-section"><strong>Próximamente</strong>Esta sección está temporalmente cerrada.</div></div>`;
   return `<div><div class="category-head"><div><h3>${esc(cat.name)}</h3><p>${esc(cat.description||"")}</p></div><span class="category-status">${list.length} PRODUCTOS</span></div><div class="category-grid">${list.map((p,i)=>`<article class="card" onclick="openProduct(${p.id})">${p.isNew?'<span class="badge">NUEVA</span>':''}<div class="product-img">${getImages(p)[0]?`<img src="${esc(getImages(p)[0])}" alt="${esc(p.name)}">`:"FOTO DEL PRODUCTO"}</div><div class="card-body"><h4>${esc(p.name)}</h4><p class="desc">${esc(p.desc)}</p><div class="price">${money(p.price)}</div>${p.sold?'<p class="sold">Agotada</p>':''}</div></article>`).join("")||'<p class="hint">No hay productos publicados todavía.</p>'}</div></div>`;
 }).join("");
}
function setLink(sel,url){const e=$(sel);if(!url){e.style.display="none";e.removeAttribute("href");return}e.style.display="";e.href=url}
function waLink(number,p){if(!number)return"";const text=`Hola, me interesa la ${p.name}. ¿Me pueden dar más información?`;return `https://wa.me/${number}?text=${encodeURIComponent(text)}`}
function igMessageLink(p){if(!settings.instagram)return"";return settings.instagram}
window.openProduct=id=>{
 const p=products.find(x=>x.id===id);if(!p)return;
 const wa1=waLink(settings.whatsapp1,p),wa2=waLink(settings.whatsapp2,p);
 $("#productDetail").innerHTML=`<div class="product-detail"><div class="detail-image">${getImages(p)[0]?`<img src="${esc(getImages(p)[0])}" alt="${esc(p.name)}">`:"FOTO DEL PRODUCTO"}</div><div class="detail-copy">${p.isNew?'<span class="badge">NUEVA</span>':''}<p class="eyebrow">DETALLES DEL PRODUCTO</p><h2>${esc(p.name)}</h2><div class="detail-price">${money(p.price)}</div><div class="detail-meta"><strong>Modelo:</strong> ${esc(p.model||"Consultar")}<br><strong>Talla:</strong> ${esc(p.size||"Consultar")}<br><strong>Disponibilidad:</strong> ${p.sold?"Agotada":"Disponible"}</div><p class="desc">${esc(p.desc)}</p><div class="contact-actions">${settings.instagram?`<a class="contact-action" target="_blank" href="${esc(igMessageLink(p))}">📸 Preguntar por Instagram</a>`:""}${wa1?`<a class="contact-action" target="_blank" href="${wa1}">💬 WhatsApp 1 · Pedir información</a>`:""}${wa2?`<a class="contact-action" target="_blank" href="${wa2}">💬 WhatsApp 2 · Pedir información</a>`:""}</div></div></div>`;
 $("#productModal").classList.remove("hidden");
}
$("#closeProduct").onclick=()=>$("#productModal").classList.add("hidden");
$("#productModal").onclick=e=>{if(e.target.id==="productModal")$("#productModal").classList.add("hidden")};

// ---- Admin rendering ----
function renderAdminProducts(){
 $("#adminProducts").innerHTML=products.map((p,i)=>{const images=getImages(p);return `<div class="admin-product"><div>${images[0]?`<img class="admin-thumb" src="${esc(images[0])}" alt="">`:'<div class="admin-thumb"></div>'}</div><div><div class="admin-fields"><input data-i="${i}" data-k="name" value="${esc(p.name)}" placeholder="Nombre"><input data-i="${i}" data-k="price" type="number" value="${p.price}" placeholder="Precio"><input data-i="${i}" data-k="size" value="${esc(p.size||"")}" placeholder="Talla"><input data-i="${i}" data-k="model" value="${esc(p.model||"")}" placeholder="Modelo"><textarea data-i="${i}" data-k="desc" placeholder="Descripción">${esc(p.desc)}</textarea><label>Fotos del producto<input data-i="${i}" data-k="files" type="file" accept="image/*" multiple></label><label>Agregar foto por URL<input data-i="${i}" data-k="imageUrl" type="url" placeholder="https://ejemplo.com/foto.jpg"><button type="button" class="button small" onclick="addProductImageUrl(${i})">Agregar URL</button></label><div class="photo-picker-list">${images.map((image,index)=>`<div><img src="${esc(image)}" alt=""><button type="button" onclick="removeProductImage(${i},${index})">Quitar</button></div>`).join("")}</div><select data-i="${i}" data-k="category">${categories.map(c=>`<option value="${esc(c.id)}" ${p.category===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div><label class="toggle"><input data-i="${i}" data-k="isNew" type="checkbox" ${p.isNew?"checked":""}> Mostrar etiqueta NUEVA</label><label class="toggle"><input data-i="${i}" data-k="sold" type="checkbox" ${p.sold?"checked":""}> Agotada</label><div class="actions"><button onclick="removeProduct(${i})">Eliminar</button></div></div></div>`}).join("");
 document.querySelectorAll("#adminProducts [data-i]").forEach(el=>el.onchange=async()=>{const i=+el.dataset.i,k=el.dataset.k;if(k==="files"){const files=[...el.files];if(!files.length)return;el.disabled=true;setSaveStatus("Subiendo fotos…","saving");try{const added=await Promise.all(files.map(uploadCatalogImage));products[i].images=[...getImages(products[i]),...added];products[i].image=products[i].images[0]||"";persist();}catch(error){console.log("[v0] Error subiendo foto:",error.message);setSaveStatus("Error al subir foto","error");alert(error.message);}finally{el.disabled=false;el.value="";}}else{products[i][k]=el.type==="checkbox"?el.checked:(k==="price"?Number(el.value):el.value);persist();}});
}
window.addProductImageUrl=(productIndex)=>{const input=document.querySelector(`#adminProducts input[data-i="${productIndex}"][data-k="imageUrl"]`);const url=input?.value.trim();if(!url)return;try{const parsed=new URL(url);if(!["http:","https:"].includes(parsed.protocol))throw new Error();}catch{alert("Escribe una URL válida que empiece con https://");return}const p=products[productIndex];p.images=[...getImages(p),url];p.image=p.images[0]||"";persist()};
window.removeProductImage=(productIndex,imageIndex)=>{const p=products[productIndex];p.images=getImages(p).filter((_,index)=>index!==imageIndex);p.image=p.images[0]||"";persist()};
function renderAdminCategories(){
 $("#adminCategories").innerHTML=categories.map((c,i)=>`<div class="admin-category"><div class="admin-fields"><input data-ci="${i}" data-k="name" value="${esc(c.name)}" placeholder="Nombre de sección"><input data-ci="${i}" data-k="id" value="${esc(c.id)}" placeholder="ID único"><textarea data-ci="${i}" data-k="description" placeholder="Descripción">${esc(c.description||"")}</textarea></div><label class="toggle"><input data-ci="${i}" data-k="visible" type="checkbox" ${c.visible?"checked":""}> Publicar sección (desmarcado = Próximamente y bloqueada)</label><div class="actions"><button onclick="removeCategory(${i})">Eliminar sección</button></div></div>`).join("");
 document.querySelectorAll("#adminCategories [data-ci]").forEach(el=>el.onchange=()=>{const i=+el.dataset.ci,k=el.dataset.k;categories[i][k]=el.type==="checkbox"?el.checked:el.value;persist()});
}
function loadSettingsForm(){document.querySelectorAll("[data-setting]").forEach(e=>e.value=settings[e.dataset.setting]||"")}
window.removeProduct=i=>{if(confirm("¿Eliminar este producto?")){products.splice(i,1);persist()}};
window.removeCategory=i=>{const id=categories[i].id;if(products.some(p=>p.category===id)){alert("No puedes eliminar una sección que todavía tiene productos.");return}if(confirm("¿Eliminar esta sección?")){categories.splice(i,1);persist()}};

$("#adminBtn").onclick=()=>{$("#adminModal").classList.remove("hidden");if(isAdmin){$("#loginView").classList.add("hidden");$("#adminView").classList.remove("hidden");renderAdminProducts();renderAdminCategories();loadSettingsForm();}else{$("#loginView").classList.remove("hidden");$("#adminView").classList.add("hidden");$("#password").value="";}};
$("#closeAdmin").onclick=()=>$("#adminModal").classList.add("hidden");
$("#login").onclick=async()=>{
  const btn=$("#login");btn.disabled=true;
  try{
    const res=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:$("#password").value})});
    if(res.ok){isAdmin=true;$("#loginView").classList.add("hidden");$("#adminView").classList.remove("hidden");renderAdminProducts();renderAdminCategories();loadSettingsForm();}
    else{const d=await res.json().catch(()=>({}));alert(d.error||"Contraseña incorrecta");}
  }catch(e){alert("No se pudo conectar con el servidor.");}
  finally{btn.disabled=false;}
};
$("#addProduct").onclick=()=>{products.push({id:Date.now(),category:categories[0]?.id||"",name:"Nuevo producto",price:0,size:"",model:"",desc:"Escribe aquí la descripción.",image:"",images:[],sold:false,isNew:true});persist()};
$("#addCategory").onclick=()=>{categories.push({id:"categoria-"+Date.now(),name:"Nueva sección",description:"Descripción de la sección.",visible:false});persist()};
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");["productsTab","categoriesTab","settingsTab"].forEach(id=>$("#"+id).classList.add("hidden"));$("#"+b.dataset.tab).classList.remove("hidden");if(b.dataset.tab==="settingsTab")loadSettingsForm()});
$("#saveSettings").onclick=async()=>{document.querySelectorAll("[data-setting]").forEach(e=>settings[e.dataset.setting]=e.value);render();await saveCatalog();alert("Configuración guardada.")};
$("#reset").onclick=async()=>{if(confirm("¿Restaurar todo? Esto reemplazará el catálogo actual para todos los visitantes.")){settings={...defaults};categories=JSON.parse(JSON.stringify(starterCats));products=[];render();renderAdminProducts();renderAdminCategories();loadSettingsForm();await saveCatalog();}};

loadCatalog();
