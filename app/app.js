/* Carcasa del curso: rutas hash, progreso, tests, repaso. Sin dependencias (KaTeX opcional). */
(function(){
"use strict";
var KEY="curso-seg-ia/v2", KEY1="curso-seg-ia/v1", DAY=86400000, INTERVALOS=[0,1,3,7,14];
var $=function(s,r){return (r||document).querySelector(s)};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var ESC={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return ESC[c]})};
var inl=function(s){return esc(s).replace(/`([^`]+)`/g,"<code>$1</code>")};
var pct=function(x){return Math.round(x)+" %"};
var fmtFecha=function(t){try{return new Date(t).toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})}catch(e){return ""}};

/* ---------- datos ---------- */
var DATA={modulos:[],lecciones:{}};
try{DATA=JSON.parse($("#curso-data").textContent)}catch(e){}
DATA.modulos=DATA.modulos||[]; DATA.lecciones=DATA.lecciones||{};
var LIST=[], BYID={};
DATA.modulos.forEach(function(m,mi){
  m.lecciones.forEach(function(l,li){
    var it={id:m.id+"/"+l.id,m:m,mi:mi,l:l,li:li,idx:LIST.length};
    LIST.push(it); BYID[it.id]=it;
  });
});
function avail(id){return !!DATA.lecciones[id]}
function preguntas(id){
  var d=DATA.lecciones[id]; if(!d||!d.test) return [];
  var t=d.test; if(!Array.isArray(t)) t=t.preguntas||t.questions||[];
  return t.filter(function(q){return q&&q.id!=null});
}
function color(mi){return "var(--m"+(mi%9)+")"}

/* ---------- progreso v2 (localStorage con respaldo en memoria) ---------- */
function vacio(){return {teoria:{},practica:{},notas:{},leitner:{},diario:[],tema:"auto"}}
function esObj(x){return !!x&&typeof x==="object"&&!Array.isArray(x)}
function normalizar(s){
  var o=vacio(); if(!esObj(s)) return o;
  ["teoria","practica","notas","leitner"].forEach(function(k){if(esObj(s[k])) o[k]=s[k]});
  if(Array.isArray(s.diario)) o.diario=s.diario.filter(function(e){return esObj(e)&&typeof e.t==="number"&&typeof e.tipo==="string"});
  if(s.tema==="light"||s.tema==="dark") o.tema=s.tema;
  return o;
}
function cargar(){
  var s=null;
  try{s=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  if(esObj(s)) return normalizar(s);
  var v1=null; try{v1=JSON.parse(localStorage.getItem(KEY1))}catch(e){}
  if(esObj(v1)){
    var o=normalizar({notas:v1.notas,leitner:v1.leitner,tema:v1.tema});
    if(esObj(v1.vistas)) o.teoria=v1.vistas;
    return o;
  }
  return vacio();
}
var state=cargar();
function guardar(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
guardar();
function anotar(leccion,tipo,detalle){state.diario.push({t:Date.now(),leccion:leccion||"",tipo:tipo,detalle:detalle||""}); guardar()}

/* ejercicios de cada lección, leídos del fragmento */
var EJ={};
Object.keys(DATA.lecciones).forEach(function(id){
  var seen={}, m=(DATA.lecciones[id].html||"").match(/data-ejercicio="([^"]+)"/g)||[];
  EJ[id]=m.map(function(x){return x.slice(16,-1)}).filter(function(x){return seen[x]?false:(seen[x]=1)});
});
function teoriaOk(id){return !!state.teoria[id]}
function practicaOk(id){
  var e=EJ[id]||[], p=state.practica[id]||{};
  return e.length?e.every(function(x){return !!p[x]}):!!p._;
}
function testOk(id){
  if(!preguntas(id).length) return avail(id);
  var n=state.notas[id]; return !!n&&n.mejor>=70;
}
function marcas(id){return [teoriaOk(id),practicaOk(id),testOk(id)]}
function completa(id){return avail(id)&&marcas(id).every(Boolean)}
function marcarTeoria(id){
  if(state.teoria[id]) return;
  state.teoria[id]=Date.now(); anotar(id,"teoria","Teoría leída"); pintarMarcas();
}
function alternarEjercicio(id,eid){
  var p=state.practica[id]||(state.practica[id]={}), hecho=!p[eid];
  if(hecho) p[eid]=Date.now(); else delete p[eid];
  anotar(id,"ejercicio","Ejercicio "+String(eid).toUpperCase()+(hecho?" hecho":" deshecho")); pintarMarcas();
  return hecho;
}
function registrarNota(id,ok,total){
  var p=total?ok*100/total:0, n=state.notas[id]||{mejor:0,intentos:0};
  n.ultima=p; n.mejor=Math.max(n.mejor||0,p); n.intentos=(n.intentos||0)+1; n.fecha=Date.now();
  state.notas[id]=n; anotar(id,"test","Nota "+pct(p)+" ("+ok+" de "+total+")"); pintarMarcas();
  return n;
}
/* Leitner: acierto sube de caja, fallo vuelve a la 1. Toca a los INTERVALOS[caja-1] dias. */
function leitner(id,qid,acierto){
  var k=id+"#"+qid, e=state.leitner[k]||{caja:1,prox:0};
  e.caja=acierto?Math.min(5,e.caja+1):1;
  e.prox=Date.now()+INTERVALOS[e.caja-1]*DAY;
  state.leitner[k]=e; guardar();
}
function vencidas(){
  var ahora=Date.now(), out=[];
  LIST.forEach(function(it){
    if(!avail(it.id)||!teoriaOk(it.id)) return;
    preguntas(it.id).forEach(function(q){
      var e=state.leitner[it.id+"#"+q.id], prox=e?e.prox:0;
      if(prox<=ahora) out.push({lid:it.id,q:q,prox:prox,caja:e?e.caja:1});
    });
  });
  out.sort(function(a,b){return a.prox-b.prox||a.caja-b.caja});
  return out;
}

/* ---------- utilidades de vista ---------- */
function num2(id){return parseInt(id.slice(1),10)}
function etiqueta(lid){var it=BYID[lid]; return it?num2(it.m.id)+"."+num2(it.l.id)+" "+it.l.titulo:""}
function resumenModulo(mi){
  var m=DATA.modulos[mi], r={tot:m.lecciones.length,disp:0,t:0,p:0,q:0,c:0};
  m.lecciones.forEach(function(l){
    var id=m.id+"/"+l.id; if(!avail(id)) return;
    var k=marcas(id); r.disp++; if(k[0]) r.t++; if(k[1]) r.p++; if(k[2]) r.q++; if(k.every(Boolean)) r.c++;
  });
  return r;
}
function barra(x,total,c){
  var w=total?Math.round(x*100/total):0;
  return '<div class="progbar" role="progressbar" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+x+'" style="--c:'+(c||"var(--accent)")+'"><i style="width:'+w+'%"></i></div>';
}
var PARTES=[["teoria","Teoría"],["practica","Práctica"],["test","Test"]];
function dots3(id){
  var k=marcas(id);
  return '<span class="dots" title="Teoría, práctica, test">'+PARTES.map(function(p,i){
    return '<i class="pt'+(k[i]?" on":"")+'" data-dot="'+p[0]+'" aria-hidden="true"></i>';
  }).join("")+'<span class="sr">'+PARTES.map(function(p,i){return p[1]+(k[i]?" hecha":" pendiente")}).join(", ")+'</span></span>';
}
function chipsLeccion(id){
  if(!avail(id)) return '<span class="chip pend">pendiente</span>';
  var n=state.notas[id];
  return dots3(id)+(n?'<span class="chip'+(n.mejor>=70?" ok":"")+'">nota '+pct(n.mejor)+'</span>':"");
}
/* ---------- indice lateral ---------- */
var RUTA={tipo:"indice"}, abiertos={}, obs=null;
function pintarToc(){
  var toc=$("#toc"); if(!toc) return;
  $$("details[data-m]",toc).forEach(function(d){abiertos[d.getAttribute("data-m")]=d.open});
  var cur=RUTA.tipo==="leccion"?RUTA.id:null, h='<div class="quick">';
  [["indice","#/","Curso"],["repaso","#/repaso","Repaso"],["progreso","#/progreso","Progreso"]].forEach(function(x){
    h+='<a href="'+x[1]+'"'+(RUTA.tipo===x[0]?' aria-current="page"':"")+'>'+x[2]+'</a>';
  });
  h+='</div><ol>';
  DATA.modulos.forEach(function(m,mi){
    var r=resumenModulo(mi), abre=abiertos[m.id];
    if(abre===undefined) abre=!!(cur&&cur.indexOf(m.id+"/")===0);
    h+='<li style="--c:'+color(mi)+'"><details data-m="'+m.id+'"'+(abre?" open":"")+'><summary><span class="dot"></span><span>'+num2(m.id)+'. '+esc(m.titulo)+'</span><span class="n">'+r.c+'/'+r.tot+'</span></summary><ol>';
    m.lecciones.forEach(function(l){
      var id=m.id+"/"+l.id;
      if(avail(id)) h+='<li><a href="#/'+id+'"'+(completa(id)?' class="done"':"")+(id===cur?' aria-current="page"':"")+'>'+esc(l.titulo)+'</a></li>';
      else h+='<li><span class="pend">'+esc(l.titulo)+' (pendiente)</span></li>';
    });
    h+='</ol></details></li>';
  });
  toc.innerHTML=h+'</ol>';
  $$(".topnav a").forEach(function(a){
    var t=a.getAttribute("data-nav");
    if(t===RUTA.tipo) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
  });
}

/* ---------- vistas ---------- */
function vistaIndice(){
  var disp=LIST.filter(function(i){return avail(i.id)}).length;
  var comp=LIST.filter(function(i){return completa(i.id)}).length;
  var sig=null;
  LIST.some(function(i){if(avail(i.id)&&!completa(i.id)){sig=i;return true}});
  if(!sig) LIST.some(function(i){if(avail(i.id)){sig=i;return true}});
  var due=vencidas().length, empezado=Object.keys(state.teoria).length||Object.keys(state.notas).length;
  var h='<div class="hero"><p class="eyebrow">Curso privado</p><h1>Seguridad de la IA</h1>'+
    '<p class="sub">Riesgo, robustez, monitorización, alineamiento y gobernanza, con fórmulas, ejercicios y tests que se corrigen solos.</p></div>'+
    '<div class="total"><p><b>'+comp+' de '+LIST.length+'</b> lecciones completas (teoría, práctica y test aprobado). Disponibles ahora: '+disp+'.</p>'+barra(comp,LIST.length)+
    '<div class="actions">'+(sig?'<a class="btn primary" href="#/'+sig.id+'">'+(empezado?"Continuar: ":"Empezar: ")+esc(sig.l.titulo)+'</a>':"")+
    '<a class="btn" href="#/repaso">Repaso'+(due?" ("+due+" por hacer)":"")+'</a></div></div>';
  DATA.modulos.forEach(function(m,mi){
    var r=resumenModulo(mi);
    h+='<section class="modulo" style="--c:'+color(mi)+'"><span class="mn">Módulo '+num2(m.id)+'</span><h2>'+esc(m.titulo)+'</h2>'+
      '<p class="st">'+r.c+' de '+r.tot+' completas · teoría '+r.t+' · práctica '+r.p+' · test '+r.q+' · '+r.disp+' disponibles</p>'+barra(r.c,r.tot,color(mi))+'<ul class="lecs">';
    m.lecciones.forEach(function(l){
      var id=m.id+"/"+l.id;
      h+='<li><span class="t">'+(avail(id)?'<a href="#/'+id+'">'+esc(l.titulo)+'</a>':'<span class="off">'+esc(l.titulo)+'</span>')+
        '</span><span class="chips"><span class="chip">'+l.minutos+' min</span>'+(l.notebook?'<span class="chip">notebook</span>':"")+chipsLeccion(id)+'</span></li>';
    });
    h+='</ul></section>';
  });
  return h+'<footer class="end">Uso privado. Progreso guardado en este navegador; expórtalo desde Progreso para tener copia.</footer>';
}
function hrefParte(id,k){return "#/"+id+(k==="teoria"?"":"/"+k)}
function pagerLecciones(it){
  var p=LIST[it.idx-1], n=LIST[it.idx+1];
  return '<nav class="pager" aria-label="Navegación entre lecciones">'+
    (p?'<a class="prev" href="#/'+p.id+'"><small>Lección anterior</small>'+esc(p.l.titulo)+(avail(p.id)?"":" (pendiente)")+'</a>':"")+
    (n?'<a class="next" href="#/'+n.id+'"><small>Lección siguiente</small>'+esc(n.l.titulo)+(avail(n.id)?"":" (pendiente)")+'</a>':"")+'</nav>';
}
function pieParte(it,k){
  var i=k==="teoria"?0:k==="practica"?1:2, prev="", next="";
  if(i===0){
    var p=LIST[it.idx-1];
    if(p) prev='<a class="prev" href="#/'+p.id+'"><small>Lección anterior</small>'+esc(p.l.titulo)+(avail(p.id)?"":" (pendiente)")+'</a>';
  }else prev='<a class="prev" href="'+hrefParte(it.id,PARTES[i-1][0])+'"><small>Anterior</small>'+PARTES[i-1][1]+'</a>';
  if(i<2) next='<a class="next" href="'+hrefParte(it.id,PARTES[i+1][0])+'"><small>Siguiente</small>'+PARTES[i+1][1]+'</a>';
  else{
    var n=LIST[it.idx+1];
    next=n?'<a class="next" href="#/'+n.id+'"><small>Lección siguiente</small>'+esc(n.l.titulo)+(avail(n.id)?"":" (pendiente)")+'</a>':'<a class="next" href="#/"><small>Fin del curso</small>Volver al índice</a>';
  }
  return '<nav class="pager" aria-label="Siguiente parte">'+prev+next+'</nav>';
}
function vistaLeccion(id){
  var it=BYID[id];
  if(!it) return '<h1 tabindex="-1">Lección no encontrada</h1><p><a href="#/">Volver al índice</a></p>';
  var l=it.l, m=it.m, ok=avail(id);
  var h='<header style="--c:'+color(it.mi)+'"><p class="eyebrow">Módulo '+num2(m.id)+' · '+esc(m.titulo)+'</p><h1 tabindex="-1">'+esc(l.titulo)+'</h1>'+
    '<ul class="meta"><li class="chip">'+l.minutos+' min</li>'+(l.notebook?'<li class="chip">con notebook</li>':"")+
    (l.fuentes||[]).map(function(f){return '<li class="chip">'+(f==="Atlas"?'<a href="atlas.html" target="_blank" rel="noopener">Atlas</a>':esc(f))+'</li>'}).join("")+(ok?'<li class="chip">'+dots3(id)+'</li>':"")+'</ul></header>';
  if(!ok){
    return h+'<p class="aviso">Esta lección está pendiente: todavía no se ha escrito. Aparece en el índice para ver el mapa completo del curso.</p>'+pagerLecciones(it);
  }
  h+='<nav class="tabs" aria-label="Partes de la lección">'+PARTES.map(function(p){
    return '<a href="'+hrefParte(id,p[0])+'" data-tab="'+p[0]+'"><i class="pt" data-dot="'+p[0]+'" aria-hidden="true"></i>'+p[1]+'<span class="sr" data-st="'+p[0]+'"></span></a>';
  }).join("")+'</nav>';
  PARTES.forEach(function(p){
    h+='<section class="panel" data-panel="'+p[0]+'" hidden aria-label="'+p[1]+'"><div class="pbody"></div>'+pieParte(it,p[0])+'</section>';
  });
  return h;
}
function diaClave(t){var d=new Date(t),z=function(n){return n<10?"0"+n:""+n};return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate())}
var TIPOS={teoria:"Teoría",ejercicio:"Práctica",test:"Test",repaso:"Repaso"};
function mediaNotas(ids){
  var v=ids.filter(function(id){return state.notas[id]}).map(function(id){return state.notas[id].mejor});
  return v.length?v.reduce(function(a,b){return a+b},0)/v.length:null;
}
function vistaDiario(){
  var d=state.diario.slice(-400).reverse();
  if(!d.length) return '<p class="aviso">Todavía no hay actividad registrada.</p>';
  var h="", dia="";
  d.forEach(function(e){
    var k=diaClave(e.t);
    if(k!==dia){
      if(dia) h+='</ul>';
      dia=k;
      var f=""; try{f=new Date(e.t).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}catch(x){f=k}
      h+='<h3 class="dia">'+esc(f)+'</h3><ul class="diario">';
    }
    var hr=""; try{hr=new Date(e.t).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}catch(x){}
    h+='<li><span class="hr">'+hr+'</span><span class="chip">'+esc(TIPOS[e.tipo]||e.tipo)+'</span><span class="lec">'+(e.leccion&&BYID[e.leccion]?esc(etiqueta(e.leccion)):"Repaso general")+'</span><span class="det">'+esc(e.detalle)+'</span></li>';
  });
  return h+'</ul>'+(state.diario.length>400?'<p class="sub">Se muestran los últimos 400 eventos; el registro exportado los incluye todos.</p>':"");
}
function vistaProgreso(){
  var comp=LIST.filter(function(i){return completa(i.id)}).length, dias={};
  state.diario.forEach(function(e){dias[diaClave(e.t)]=1});
  var media=mediaNotas(LIST.map(function(i){return i.id}));
  var h='<div class="hero"><p class="eyebrow">Tu avance</p><h1 tabindex="-1">Progreso</h1></div>'+
    '<div class="cajas"><div><b>'+comp+' de '+LIST.length+'</b><small>lecciones completas</small></div><div><b>'+Object.keys(dias).length+'</b><small>días de estudio</small></div><div><b>'+(media==null?"-":pct(media))+'</b><small>nota media (mejor)</small></div></div>'+
    '<h2>Por módulo</h2><div class="tw"><table><thead><tr><th>Módulo</th><th>Completas</th><th>Teoría</th><th>Práctica</th><th>Test</th><th>Nota media</th></tr></thead><tbody>';
  DATA.modulos.forEach(function(m,mi){
    var r=resumenModulo(mi), nm=mediaNotas(m.lecciones.map(function(l){return m.id+"/"+l.id}));
    h+='<tr><td>'+num2(m.id)+'. '+esc(m.titulo)+'</td><td>'+r.c+'/'+r.tot+'</td><td>'+r.t+'</td><td>'+r.p+'</td><td>'+r.q+'</td><td>'+(nm==null?"-":pct(nm))+'</td></tr>';
  });
  h+='</tbody></table></div><h2>Diario</h2>'+vistaDiario();
  var cnt=[0,0,0,0,0]; Object.keys(state.leitner).forEach(function(k){var c=state.leitner[k].caja; if(c>=1&&c<=5) cnt[c-1]++});
  h+='<h2>Cajas de repaso</h2><p class="sub">Cada pregunta contestada sube de caja si aciertas y vuelve a la 1 si fallas. Toca repasarla a los 0, 1, 3, 7 y 14 días.</p><div class="cajas">'+
    cnt.map(function(c,i){return '<div><b>'+c+'</b><small>caja '+(i+1)+'</small></div>'}).join("")+'</div>'+
    '<h2>Registro</h2><p class="sub">El almacenamiento del navegador puede vaciarse: exporta el registro de vez en cuando.</p>'+
    '<p class="acc"><a class="btn primary" href="#/repaso">Ir al repaso ('+vencidas().length+' por hacer)</a> '+
    '<button type="button" class="btn" id="exportar">Exportar registro</button> <button type="button" class="btn" id="importar">Importar registro</button> '+
    '<button type="button" class="btn danger" id="borrar">Borrar progreso</button>'+
    '<input type="file" id="fichero" accept="application/json,.json" hidden></p><p id="reg-msg" class="sub" role="status" aria-live="polite"></p>';
  return h;
}
function msgReg(t){var e=$("#reg-msg"); if(e) e.textContent=t}
function exportarRegistro(){
  try{
    var o={formato:"curso-seg-ia",version:2,exportado:new Date().toISOString(),estado:state};
    var blob=new Blob([JSON.stringify(o,null,1)],{type:"application/json"});
    var url=URL.createObjectURL(blob), a=document.createElement("a");
    a.href=url; a.download="curso-seg-ia-registro-"+diaClave(Date.now())+".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},1500);
    msgReg("Registro exportado ("+state.diario.length+" eventos).");
  }catch(e){msgReg("No se pudo exportar el registro en este navegador.")}
}
function validarRegistro(o){
  if(!esObj(o)||o.formato!=="curso-seg-ia"||!esObj(o.estado)) return null;
  var e=o.estado, k;
  if(!["teoria","practica","notas","leitner"].every(function(x){return esObj(e[x])})||!Array.isArray(e.diario)) return null;
  if(!e.diario.every(function(x){return esObj(x)&&typeof x.t==="number"&&typeof x.tipo==="string"})) return null;
  for(k in e.notas) if(!esObj(e.notas[k])||typeof e.notas[k].mejor!=="number") return null;
  for(k in e.leitner) if(!esObj(e.leitner[k])||typeof e.leitner[k].caja!=="number"||typeof e.leitner[k].prox!=="number") return null;
  for(k in e.practica) if(!esObj(e.practica[k])) return null;
  return normalizar(e);
}
function importarRegistro(file){
  var fr=new FileReader();
  fr.onerror=function(){msgReg("No se pudo leer el fichero.")};
  fr.onload=function(){
    var o=null; try{o=JSON.parse(fr.result)}catch(e){}
    var est=validarRegistro(o);
    if(!est){msgReg("El fichero no es un registro válido del curso; no se ha cambiado nada.");return}
    var ok=true;
    try{ok=window.confirm("Se sustituirá el progreso actual por el del fichero: "+Object.keys(est.teoria).length+" teorías leídas, "+Object.keys(est.notas).length+" tests y "+est.diario.length+" eventos del diario. ¿Continuar?")}catch(e){}
    if(!ok){msgReg("Importación cancelada.");return}
    est.tema=state.tema; state=est; guardar(); render();
    msgReg("Registro importado.");
  };
  fr.readAsText(file);
}
/* ---------- motor de tests ---------- */
function idxCorrectas(q){
  var o=q.opciones||[], c=q.correcta;
  function uno(x){
    if(typeof x==="number") return x;
    if(typeof x==="string"){
      var i=o.indexOf(x); if(i>=0) return i;
      if(/^\d+$/.test(x)) return parseInt(x,10);
      if(/^[a-zA-Z]$/.test(x)) return x.toLowerCase().charCodeAt(0)-97;
    }
    return -1;
  }
  return Array.isArray(c)?c.map(uno):[uno(c)];
}
function vfCorrecta(q){var c=q.correcta; return c===true||/^(v|verdadero|true|1|s|si|sí)$/i.test(String(c).trim())}
function num(n){try{return Number(n).toLocaleString("es-ES",{maximumFractionDigits:8})}catch(e){return String(n)}}
function htmlPregunta(it,n,repaso){
  var q=it.q, tipo=q.tipo, name="q"+n, h='<article class="q" data-n="'+n+'">';
  if(repaso&&BYID[it.lid]) h+='<a class="from" href="#/'+it.lid+'">'+esc(BYID[it.lid].l.titulo)+'</a>';
  h+='<fieldset><legend><span class="qn">Pregunta '+(n+1)+'</span>'+inl(q.enunciado)+'</legend>';
  if(tipo==="multiple") h+='<p class="sub" style="font-size:.85rem;margin:0 0 .5rem">Marca todas las correctas.</p>';
  if(tipo==="unica"||tipo==="multiple"){
    (q.opciones||[]).forEach(function(o,i){
      h+='<label class="opt"><input type="'+(tipo==="unica"?"radio":"checkbox")+'" name="'+name+'" value="'+i+'"><span>'+inl(o)+'</span></label>';
    });
  }else if(tipo==="vf"){
    h+='<label class="opt"><input type="radio" name="'+name+'" value="1"><span>Verdadero</span></label>'+
       '<label class="opt"><input type="radio" name="'+name+'" value="0"><span>Falso</span></label>';
  }else if(tipo==="numerica"){
    h+='<label class="sr" for="'+name+'n">Tu respuesta numérica</label><input type="text" id="'+name+'n" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="Escribe un número"> '+(q.unidad?'<span>'+inl(q.unidad)+'</span>':"");
  }
  h+='</fieldset><div class="actions"><button type="button" class="btn" data-act="check">Comprobar</button></div><div class="fbw" role="status" aria-live="polite"></div></article>';
  return h;
}
/* Número en formato español: "1.000" son mil, "0,5" es medio, "12 %" vale 12.
   Sin coma, los puntos en grupos de tres cifras son de miles; si no, decimales. */
function leerNumero(txt){
  var s=String(txt).replace(/[\s  %]/g,"").replace(/−/g,"-");
  if(s==="") return null;
  if(s.indexOf(",")>=0) s=s.replace(/\./g,"").replace(",",".");
  else if(/^-?\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,"");
  var n=Number(s);
  return isNaN(n)?null:n;
}
function leerRespuesta(card,q){
  var name="q"+card.getAttribute("data-n");
  if(q.tipo==="numerica"){
    return leerNumero($("input[type=text]",card).value);
  }
  var sel=$$("input:checked",card).map(function(i){return parseInt(i.value,10)});
  if(!sel.length) return null;
  return q.tipo==="multiple"?sel:sel[0];
}
function evaluar(q,r){
  var cor;
  if(q.tipo==="numerica"){
    var c=Number(q.correcta), tol=Number(q.tolerancia)||0;
    return {ok:Math.abs(r-c)<=tol+1e-9*Math.max(1,Math.abs(c)),txt:"Valor correcto: "+num(c)+(tol?" (se admite ± "+num(tol)+")":"")+(q.unidad?" "+q.unidad:"")};
  }
  if(q.tipo==="vf"){var v=vfCorrecta(q); return {ok:(r===1)===v,txt:"Correcta: "+(v?"Verdadero":"Falso"),marca:[v?1:0]}}
  cor=idxCorrectas(q);
  var ok=q.tipo==="multiple"?(r.length===cor.length&&r.every(function(x){return cor.indexOf(x)>=0})):r===cor[0];
  var lista=cor.map(function(i){return inl((q.opciones||[])[i])});
  return {ok:ok,txt:(cor.length>1?"Correctas: ":"Correcta: ")+lista.join("; "),marca:cor};
}
function montarPreguntas(cont,items,modo){
  var repaso=modo==="repaso", res={}, hechas=0, total=items.length;
  var cab=repaso?"":'<p class="sub" style="margin-bottom:1rem">Cada pregunta se corrige con su botón. Al comprobarlas todas verás la nota.</p>';
  cont.innerHTML=cab+'<p class="chip" data-cnt>0 de '+total+' comprobadas</p><div style="margin-top:1rem">'+
    items.map(function(it,n){return htmlPregunta(it,n,repaso)}).join("")+'</div><div class="final"></div>';
  typeset(cont);
  function comprobar(card){
    var n=parseInt(card.getAttribute("data-n"),10), it=items[n], q=it.q;
    if(res[n]!==undefined) return;
    var r=leerRespuesta(card,q), fb=$(".fbw",card);
    if(r===null){fb.innerHTML='<div class="fb info">'+(q.tipo==="numerica"?"Escribe un número (vale la coma decimal).":"Elige una respuesta antes de comprobar.")+'</div>';return}
    var ev=evaluar(q,r); res[n]=ev.ok; hechas++;
    $$("input",card).forEach(function(i){i.disabled=true});
    if(ev.marca){
      $$(".opt",card).forEach(function(l,i){
        var v=parseInt($("input",l).value,10), chosen=$("input",l).checked, good=ev.marca.indexOf(v)>=0;
        if(good) l.classList.add("ok"); else if(chosen) l.classList.add("bad");
      });
    }
    $(".actions",card).style.display="none";
    fb.innerHTML='<div class="fb '+(ev.ok?"ok":"bad")+'"><b class="v">'+(ev.ok?"Correcto":"Incorrecto")+'</b>'+(ev.ok&&q.tipo!=="numerica"?"":'<p>'+ev.txt+'</p>')+(q.explicacion?'<p>'+inl(q.explicacion)+'</p>':"")+'</div>';
    typeset(fb);
    leitner(it.lid,q.id,ev.ok);
    $("[data-cnt]",cont).textContent=hechas+" de "+total+" comprobadas";
    if(hechas===total) terminar();
  }
  function terminar(){
    var ok=0; for(var k in res) if(res[k]) ok++;
    var f=$(".final",cont), h;
    if(repaso){
      anotar("","repaso",ok+" de "+total+" aciertos"); guardar();
      h='<div class="nota"><p><b>'+ok+' de '+total+'</b> acertadas en este repaso.</p><p><a class="btn primary" href="#/repaso" data-act="otra">Hacer otra tanda</a></p></div>';
    }else{
      var lid=items[0].lid, prev=state.notas[lid], mejorAntes=prev?prev.mejor:null;
      var n=registrarNota(lid,ok,total);
      h='<div class="nota"><p>Nota: <b>'+ok+' de '+total+'</b> ('+pct(ok*100/total)+')</p><p>Mejor nota guardada: '+pct(n.mejor)+(mejorAntes!=null&&ok*100/total>mejorAntes?" (nueva marca)":"")+'. '+(n.mejor>=70?"Test aprobado.":"Para aprobar hace falta al menos el 70 %.")+'</p><p><button type="button" class="btn" data-act="reintentar">Repetir el test</button></p></div>';
    }
    f.innerHTML=h;
    var b=$(".nota a,.nota button",f); if(b&&!repaso) b.focus({preventScroll:true});
  }
  cont.onclick=function(e){
    var b=e.target.closest?e.target.closest("[data-act]"):null; if(!b) return;
    var a=b.getAttribute("data-act");
    if(a==="check") comprobar(b.closest(".q"));
    else if(a==="reintentar") montarPreguntas(cont,items,modo);
    else if(a==="otra"){e.preventDefault(); render()}
  };
  cont.onkeydown=function(e){
    if(e.key==="Enter"&&e.target.type==="text"){e.preventDefault(); comprobar(e.target.closest(".q"))}
  };
}
function montarTest(slot,lid){
  var qs=preguntas(lid); if(!qs.length) return;
  slot.classList.add("test");
  slot.innerHTML='<h2>Test</h2><div class="tbody"></div>';
  montarPreguntas($(".tbody",slot),qs.map(function(q){return {lid:lid,q:q}}),"leccion");
}
function vistaRepaso(){
  var h='<div class="hero"><p class="eyebrow">Repaso espaciado</p><h1 tabindex="-1">Repaso</h1></div>';
  var hechas=LIST.filter(function(i){return avail(i.id)&&teoriaOk(i.id)&&preguntas(i.id).length});
  if(!hechas.length) return h+'<p class="aviso">Aún no hay nada que repasar. Lee una lección y haz su test: sus preguntas entrarán aquí.</p><p><a class="btn primary" href="#/">Ir al índice</a></p>';
  var due=vencidas();
  if(!due.length){
    var prox=Infinity; Object.keys(state.leitner).forEach(function(k){if(state.leitner[k].prox<prox) prox=state.leitner[k].prox});
    return h+'<p class="aviso">No hay preguntas vencidas.'+(isFinite(prox)?" La siguiente toca el "+fmtFecha(prox)+".":"")+'</p><p><a class="btn" href="#/progreso">Ver progreso</a></p>';
  }
  return h+'<p class="sub">Hay <b>'+due.length+'</b> pregunta'+(due.length===1?"":"s")+' que toca repasar. Esta tanda muestra hasta 10.</p><div id="repaso-slot"></div>';
}
/* ---------- KaTeX, widgets, enrutado ---------- */
var pendMath=[];
function typeset(root){
  if(!root) return false;
  try{
    if(typeof window.renderMathInElement==="function"){
      window.renderMathInElement(root,{delimiters:[{left:"\\[",right:"\\]",display:true},{left:"\\(",right:"\\)",display:false},{left:"$$",right:"$$",display:true}],throwOnError:false});
      return true;
    }
  }catch(e){}
  if(pendMath.indexOf(root)<0) pendMath.push(root);
  return false;
}
window.addEventListener("load",function(){
  var p=pendMath; pendMath=[];
  p.forEach(function(r){if(document.body.contains(r)&&typeof window.renderMathInElement==="function") typeset(r)});
});
window.CURSO={typeset:typeset,version:1};

var pendAnchor=null;
function montarWidgets(panel){
  $$("[data-widget]",panel).forEach(function(el){
    if(el.__montado) return; el.__montado=1;
    var wid=el.getAttribute("data-widget"), f=window.WIDGETS&&window.WIDGETS[wid];
    if(typeof f!=="function"){el.innerHTML='<p class="aviso" style="margin:0">El widget «'+esc(wid)+'» no está disponible en esta versión.</p>';return}
    try{f(el)}catch(err){el.insertAdjacentHTML("beforeend",'<p class="aviso">El widget «'+esc(wid)+'» ha fallado y no se puede mostrar.</p>');if(window.console)console.error(err)}
  });
}
function actualizarBotones(id){
  var main=$("#contenido"), b=$("#btn-leida",main);
  if(b){var ok=teoriaOk(id); b.disabled=ok; b.textContent=ok?"Teoría leída":"Marcar como leída"; b.classList.toggle("primary",!ok)}
  var p=state.practica[id]||{}, e=EJ[id]||[], n=0;
  $$("[data-ej]",main).forEach(function(x){
    var on=!!p[x.getAttribute("data-ej")]; if(on) n++;
    x.setAttribute("aria-pressed",on?"true":"false"); x.textContent=on?"Hecho (deshacer)":"Marcar como hecho";
    x.classList.toggle("primary",!on); var c=x.closest(".ejercicio"); if(c) c.classList.toggle("hecho",on);
  });
  var s=$(".ej-estado",main); if(s) s.textContent=e.length?"Ejercicios hechos: "+n+" de "+e.length+".":"";
}
function pintarMarcas(){
  guardar();
  if(RUTA.tipo==="leccion"&&avail(RUTA.id)){
    var id=RUTA.id, k=marcas(id), main=$("#contenido");
    $$(".meta .dots",main).forEach(function(e){e.outerHTML=dots3(id)});
    PARTES.forEach(function(p,i){
      $$('.tabs [data-dot="'+p[0]+'"]',main).forEach(function(e){e.classList.toggle("on",k[i])});
      $$('[data-st="'+p[0]+'"]',main).forEach(function(e){e.textContent=k[i]?" (hecha)":" (pendiente)"});
    });
    actualizarBotones(id);
  }
  pintarToc();
}
function mostrarParte(id,parte){
  var main=$("#contenido");
  RUTA.parte=parte;
  $$(".panel",main).forEach(function(p){p.hidden=p.getAttribute("data-panel")!==parte});
  $$(".tabs a",main).forEach(function(a){
    if(a.getAttribute("data-tab")===parte) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current");
  });
  var p=$('[data-panel="'+parte+'"]',main); if(!p) return;
  montarWidgets(p);
  if(parte==="practica"&&!(EJ[id]||[]).length&&!state.practica[id]){
    state.practica[id]={_:Date.now()}; anotar(id,"ejercicio","práctica vista (sin ejercicios)"); pintarMarcas();
  }
  var it=BYID[id]; document.title=it.l.titulo+" · "+PARTES.filter(function(x){return x[0]===parte})[0][1]+" · Seguridad de la IA";
  p.setAttribute("tabindex","-1"); try{p.focus({preventScroll:true})}catch(e){}
  if(pendAnchor){
    var el=document.getElementById(pendAnchor); pendAnchor=null;
    if(el){el.scrollIntoView({block:"start"});return}
  }
  var tabs=$(".tabs",main);
  if(tabs){var y=tabs.getBoundingClientRect().top+window.pageYOffset-64; if(y<window.pageYOffset) window.scrollTo(0,Math.max(0,y))}
}
function montarLeccion(id,parte){
  var main=$("#contenido"); if(!avail(id)) return;
  var tmp=document.createElement("div"); tmp.innerHTML=DATA.lecciones[id].html;
  var st=tmp.querySelector("[data-test]"); if(st&&st.parentNode) st.parentNode.removeChild(st);
  var pr=tmp.querySelector('[data-parte="practica"]'); if(pr&&pr.parentNode) pr.parentNode.removeChild(pr);
  var te=tmp.querySelector('[data-parte="teoria"]');
  var pT=$('[data-panel="teoria"] .pbody',main), pP=$('[data-panel="practica"] .pbody',main), pQ=$('[data-panel="test"] .pbody',main);
  pT.classList.add("leccion"); pP.classList.add("leccion");
  if(te) pT.appendChild(te); else while(tmp.firstChild) pT.appendChild(tmp.firstChild);
  if(pr) pP.appendChild(pr); else pP.innerHTML='<p class="aviso">Esta lección no tiene parte de práctica.</p>';
  pT.insertAdjacentHTML("beforeend",'<div class="marca"><div id="fin-teoria" aria-hidden="true"></div><button type="button" class="btn" id="btn-leida"></button></div>');
  $$(".ejercicio[data-ejercicio]",pP).forEach(function(c){
    c.insertAdjacentHTML("beforeend",'<div class="ej-acc"><button type="button" class="btn" data-ej="'+esc(c.getAttribute("data-ejercicio"))+'" aria-pressed="false"></button></div>');
  });
  if((EJ[id]||[]).length) pP.insertAdjacentHTML("beforeend",'<p class="ej-estado" role="status"></p>');
  if(preguntas(id).length) montarTest(pQ,id); else pQ.innerHTML='<p class="aviso">Esta lección todavía no tiene test.</p>';
  main.onclick=function(e){
    var t=e.target.closest?e.target.closest("button,a[data-ir]"):null; if(!t) return;
    if(t.id==="btn-leida") marcarTeoria(id);
    else if(t.hasAttribute("data-ej")) alternarEjercicio(id,t.getAttribute("data-ej"));
    else if(t.hasAttribute("data-ir")){
      e.preventDefault(); pendAnchor=(t.getAttribute("href")||"").replace(/^#/,"")||null;
      var nh=hrefParte(id,t.getAttribute("data-ir"));
      if(location.hash===nh) mostrarParte(id,t.getAttribute("data-ir")); else location.hash=nh;
    }
  };
  typeset(main);
  pintarMarcas();
  mostrarParte(id,parte);
  var fin=$("#fin-teoria");
  if(window.IntersectionObserver&&fin){
    obs=new IntersectionObserver(function(es){
      if(es.some(function(e){return e.isIntersecting})){marcarTeoria(id); if(obs){obs.disconnect();obs=null}}
    });
    obs.observe(fin);
  }
}
function cerrarToc(){
  document.body.classList.remove("toc-open");
  var b=$("#tocbtn"); if(b) b.setAttribute("aria-expanded","false");
}
function render(){
  var h=(location.hash||"").replace(/^#\/?/,"").replace(/\/+$/,""), main=$("#contenido"), titulo="Seguridad de la IA";
  var ml=/^(m\d\d\/l\d\d)(?:\/(practica|test))?$/.exec(h);
  if(ml){
    var id=ml[1], parte=ml[2]||"teoria";
    if(RUTA.tipo==="leccion"&&RUTA.id===id&&$(".tabs",main)){mostrarParte(id,parte);return}
    if(obs){obs.disconnect();obs=null}
    main.onclick=null;
    RUTA={tipo:"leccion",id:id,parte:parte}; main.innerHTML=vistaLeccion(id);
    if(BYID[id]) document.title=BYID[id].l.titulo+" · "+titulo;
    montarLeccion(id,parte);
    if(!avail(id)) pintarToc();
    cerrarToc(); if(!pendAnchor) window.scrollTo(0,0);
    var t=$("h1",main); if(t){try{t.focus({preventScroll:true})}catch(e){}}
    return;
  }
  if(obs){obs.disconnect();obs=null}
  main.onclick=null;
  if(h==="repaso"){
    RUTA={tipo:"repaso"}; main.innerHTML=vistaRepaso(); titulo="Repaso · "+titulo;
    var s=$("#repaso-slot"); if(s) montarPreguntas(s,vencidas().slice(0,10),"repaso");
  }else if(h==="progreso"){
    RUTA={tipo:"progreso"}; main.innerHTML=vistaProgreso(); titulo="Progreso · "+titulo;
    var bo=$("#borrar"), ex=$("#exportar"), im=$("#importar"), fi=$("#fichero");
    if(bo) bo.onclick=function(){
      var ok=true; try{ok=window.confirm("¿Borrar todo el progreso y el diario guardados en este navegador?")}catch(e){}
      if(ok){var tema=state.tema; state=vacio(); state.tema=tema; guardar(); render()}
    };
    if(ex) ex.onclick=exportarRegistro;
    if(im&&fi){
      im.onclick=function(){fi.value=""; fi.click()};
      fi.onchange=function(){if(fi.files&&fi.files[0]) importarRegistro(fi.files[0])};
    }
  }else{
    RUTA={tipo:"indice"}; main.innerHTML=vistaIndice();
  }
  document.title=titulo;
  pintarToc(); cerrarToc();
  window.scrollTo(0,0);
  var t2=$("h1",main); if(t2){t2.setAttribute("tabindex","-1"); try{t2.focus({preventScroll:true})}catch(e){}}
}

/* ---------- tema, menú lateral, arranque ---------- */
function aplicarTema(v){
  var r=document.documentElement;
  if(v==="light"||v==="dark") r.setAttribute("data-theme",v); else r.removeAttribute("data-theme");
}
function iniciar(){
  var sel=$("#tema"); aplicarTema(state.tema);
  if(sel){sel.value=state.tema; sel.onchange=function(){state.tema=sel.value; guardar(); aplicarTema(state.tema)}}
  var btn=$("#tocbtn");
  if(btn) btn.onclick=function(){
    var abre=!document.body.classList.contains("toc-open");
    document.body.classList.toggle("toc-open",abre); btn.setAttribute("aria-expanded",abre?"true":"false");
  };
  var bd=$("#backdrop"); if(bd) bd.onclick=cerrarToc;
  $("#toc").addEventListener("click",function(e){if(e.target.closest&&e.target.closest("a")) cerrarToc()});
  document.addEventListener("keydown",function(e){if(e.key==="Escape") cerrarToc()});
  window.addEventListener("hashchange",function(){if(location.hash&&location.hash.charAt(1)!=="/") return; render()});
  render();
}
iniciar();
})();
