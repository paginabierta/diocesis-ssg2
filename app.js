/* ============================================================
   Diócesis de Socorro y San Gil — PWA
   Misma lógica que la app Android (Liturgia.kt, Misas.kt, MainActivity.kt)
   ============================================================ */
'use strict';

var DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
var MESES_C = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
var HEX = {Verde:'#2E7D4F', Morado:'#5B3A87', Rojo:'#B3261E', Rosa:'#E8A0B4', Blanco:'#FFFFFF'};
var vista = document.getElementById('vista');

/* ---------- utilidades ---------- */
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function leer(k){ try{ return localStorage.getItem(k) || ''; }catch(e){ return ''; } }
function guardar(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
function pad(n){ return (n < 10 ? '0' : '') + n; }
function clave(d){ return d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()); }
function iso(d){ return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); }
function fechaLarga(d){ var n = DIAS[d.getDay()]; return n.charAt(0).toUpperCase() + n.slice(1) + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear(); }
function sinTildes(s){ return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function soloDigitos(s, max){ var n = String(s || '').replace(/[^0-9]/g, ''); return max ? n.slice(0, max) : n; }
function mapa(t){ return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(t); }
function destinoDe(p){ return [p.nombre, p.dir, p.muni, 'Santander, Colombia'].filter(Boolean).join(', '); }

/* ============================================================
   LITURGIA (equivale a Liturgia.kt)
   ============================================================ */
function tiempoLiturgico(fecha){
  var anio = fecha.getFullYear(), mes = fecha.getMonth()+1, dia = fecha.getDate();
  var a = anio % 19, b = Math.floor(anio/100), c = anio % 100, d = Math.floor(b/4), e = b % 4,
      f = Math.floor((b+8)/25), g = Math.floor((b-f+1)/3), h = (19*a+b-d-g+15) % 30,
      i = Math.floor(c/4), k = c % 4, l = (32+2*e+2*i-h-k) % 7, m = Math.floor((a+11*h+22*l)/451);
  var mesP = Math.floor((h+l-7*m+114)/31), diaP = ((h+l-7*m+114) % 31) + 1;
  function dias(mm, dd){
    var bis = anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);
    var dpm = [0,31,bis?29:28,31,30,31,30,31,31,30,31,30,31];
    var t = dd; for (var x = 1; x < mm; x++) t += dpm[x]; return t;
  }
  var hoy = dias(mes, dia), pascua = dias(mesP, diaP), navidad = dias(12, 25), epifania = dias(1, 6);
  var bautismo = epifania + 7, ceniza = pascua - 46, adviento = navidad - 22;
  if (hoy === navidad) return ['Natividad del Señor', 'Blanco'];
  if (hoy > navidad || hoy <= bautismo) return ['Tiempo de Navidad', 'Blanco'];
  if (hoy >= ceniza && hoy < pascua - 7) return ['Tiempo de Cuaresma', 'Morado'];
  if (hoy >= pascua - 7 && hoy < pascua) return ['Semana Santa', 'Rojo'];
  if (hoy === pascua + 49) return ['Pentecostés', 'Rojo'];
  if (hoy >= pascua && hoy <= pascua + 49) return ['Tiempo Pascual', 'Blanco'];
  if (hoy >= adviento) return ['Tiempo de Adviento', 'Morado'];
  return ['Tiempo Ordinario', 'Verde'];
}
function etiquetaRango(r){
  return {S:'Solemnidad', F:'Fiesta', M:'Memoria obligatoria', m:'Memoria libre', 'm*':'Conmemoración'}[r] || '';
}
/** Devuelve {nombre, rango, color, salterio, opcionales[], tiempo, aproximado} */
function diaLiturgico(fecha){
  var t = tiempoLiturgico(fecha);
  var lista = LITURGIA[clave(fecha)];
  if (!lista || !lista.length){
    return {nombre:t[0], rango:'', color:t[1], salterio:'', opcionales:[], tiempo:t[0], aproximado:true};
  }
  var p = lista[0];
  return {nombre:p[0], rango:p[1], color:p[2] || t[1], salterio:p[3],
          opcionales:lista.slice(1).map(function(x){ return x[0]; }), tiempo:t[0], aproximado:false};
}
window.diaLiturgicoTexto = function(){ return diaLiturgico(new Date()).nombre; };

/** "15 de agosto de 2016" -> [2016, 8, 15] */
function fechaKt(txt){
  var p = sinTildes(txt).trim().split(' de ');
  if (p.length !== 3) return null;
  var d = parseInt(p[0], 10), m = MESES.indexOf(p[1].trim()) + 1, a = parseInt(p[2], 10);
  return (d && m && a) ? [a, m, d] : null;
}
function aniosDesde(txt, hoy){
  hoy = hoy || new Date();
  var f = fechaKt(txt); if (!f) return null;
  var n = hoy.getFullYear() - f[0];
  var mh = hoy.getMonth()+1, dh = hoy.getDate();
  if (mh < f[1] || (mh === f[1] && dh < f[2])) n--;
  return n >= 0 ? n : null;
}
function efemerides(fecha){
  var mes = fecha.getMonth()+1, dia = fecha.getDate(), anio = fecha.getFullYear();
  var out = [];
  (TITULARES[pad(mes) + '-' + pad(dia)] || []).forEach(function(t){ out.push(['⛪', 'Fiesta titular: ' + t]); });
  SACERDOTES.forEach(function(s){
    var n = fechaKt(s.nac);
    if (n && n[1] === mes && n[2] === dia && anio - n[0] > 0) out.push(['🎂', 'Cumpleaños: ' + s.nombre + ' (' + (anio - n[0]) + ' años)']);
    var o = fechaKt(s.ord);
    if (o && o[1] === mes && o[2] === dia && anio - o[0] > 0) out.push(['✝️', 'Aniversario de ordenación: ' + s.nombre + ' (' + (anio - o[0]) + ' años)']);
  });
  return out;
}

/* ============================================================
   MISAS (equivale a Misas.kt)
   ============================================================ */
var COD_DIA = {dom:0, lun:1, mar:2, mie:3, 'mié':3, jue:4, vie:5, sab:6, 'sáb':6};
var ORDEN = [1,2,3,4,5,6,0];
function codigoDia(t){ t = t.trim().toLowerCase(); return t.length < 3 ? null : (COD_DIA[t.slice(0,3)] != null ? COD_DIA[t.slice(0,3)] : null); }
function interpretarDias(txt){
  var limpio = txt.toLowerCase().replace(/\./g, '').trim(), res = [];
  limpio.split(/\/|,| y |·/).forEach(function(b){
    b = b.trim(); if (!b) return;
    if (b.indexOf('-') >= 0){
      var pr = b.split('-'); if (pr.length !== 2) return;
      var a = codigoDia(pr[0]), z = codigoDia(pr[1]); if (a == null || z == null) return;
      var i = ORDEN.indexOf(a), iz = ORDEN.indexOf(z);
      while (true){ if (res.indexOf(ORDEN[i]) < 0) res.push(ORDEN[i]); if (i === iz) break; i = (i+1) % 7; }
    } else { var c = codigoDia(b); if (c != null && res.indexOf(c) < 0) res.push(c); }
  });
  return res;
}
var RE_HORA = /(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|m)/gi;
var _misasCache = {};
function misasDe(p){
  if (_misasCache[p.n]) return _misasCache[p.n];
  var out = [];
  if (p.misas && !/sin publicar/i.test(p.misas)){
    p.misas.split('\n').forEach(function(linea){
      linea = linea.trim(); var c = linea.indexOf(':'); if (c <= 0) return;
      var dias = interpretarDias(linea.slice(0, c)); if (!dias.length) return;
      var horas = linea.slice(c+1), nm = horas.match(/\(([^)]*)\)/), nota = nm ? nm[1] : '';
      var m; RE_HORA.lastIndex = 0;
      while ((m = RE_HORA.exec(horas))){
        var h = parseInt(m[1], 10), mi = m[2] ? parseInt(m[2], 10) : 0, suf = m[3].toLowerCase().replace(/\./g, '');
        var h24 = h % 12; if (suf === 'm') h24 = 12; else if (suf.charAt(0) === 'p') h24 += 12;
        if (h24 > 23 || mi > 59) continue;
        dias.forEach(function(d){ out.push({p:p, dia:d, min:h24*60+mi, nota:nota}); });
      }
    });
  }
  _misasCache[p.n] = out; return out;
}
function todasMisas(){ var r = []; PARROQUIAS.forEach(function(p){ r = r.concat(misasDe(p)); }); return r; }
function ahoraMin(d){ return d.getHours()*60 + d.getMinutes(); }
function horaTexto(min){ var h24 = Math.floor(min/60), m = min % 60, s = h24 < 12 ? 'a.m.' : 'p.m.', h = h24 % 12 || 12;
  return h + ':' + pad(m) + ' ' + s; }
function faltaTexto(min, d){ var x = min - ahoraMin(d);
  if (x <= 0) return ''; if (x < 60) return 'en ' + x + ' min'; return 'en ' + Math.floor(x/60) + ' h ' + (x % 60) + ' min'; }

/* ---------- mi parroquia ---------- */
function miParroquia(){ var n = parseInt(leer('miParroquia'), 10); return PARROQUIAS.filter(function(p){ return p.n === n; })[0] || null; }
function nombreCorto(p){ return p.nombre.replace(/^Pquia\.\s*/, ''); }

/* ============================================================
   NAVEGACIÓN
   ============================================================ */
var RUTAS = {
  '':            {t:'Diócesis de Socorro y San Gil', s:'Iglesia particular · Santander', f:inicio},
  'hoy':         {t:'Hoy', s:'Liturgia, diócesis y pendientes', f:hoy},
  'sacerdotes':  {t:'Sacerdotes', s:'Directorio del clero diocesano', f:sacerdotes},
  'parroquias':  {t:'Parroquias', s:'Las 54 parroquias de la diócesis', f:parroquias},
  'ordo':        {t:'Ordo y Lecturas', s:'Calendario litúrgico de Colombia', f:ordo},
  'horas':       {t:'Liturgia de las Horas', s:'Oficio divino del día', f:horas, marco:true},
  'calendario':  {t:'Calendario', s:'Agenda diocesana', f:calendario, marco:true},
  'noticias':    {t:'Noticias', s:'Sitio web diocesano', f:noticias},
  'bendiciones': {t:'Bendiciones', s:'Ritos breves para el ministerio', f:bendiciones},
  'sacramentos': {t:'Sacramentos', s:'Requisitos y trámites', f:sacramentos},
  'notas':       {t:'Notas', s:'Pendientes y apuntes', f:notas, marco:true},
  'misas':       {t:'Misas del día', s:'Horarios publicados por las parroquias', f:misas},
  'curia':       {t:'Curia Diocesana', s:'Dependencias, teléfonos y horarios', f:curia},
  'instalar':    {t:'Instalar la app', s:'En iPhone, Android o computador', f:instalar}
};
var RAICES = ['', 'hoy', 'bendiciones', 'sacramentos', 'notas'];

function ir(){
  var r = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
  var def = RUTAS[r] || RUTAS[''];
  if (!RUTAS[r]) r = '';
  document.getElementById('titulo').textContent = def.t;
  document.getElementById('subtitulo').textContent = def.s;
  document.getElementById('btnAtras').hidden = (r === '');
  document.getElementById('escudoBarra').hidden = (r !== '');
  vista.className = def.marco ? 'marco' : '';
  vista.innerHTML = '';
  cerrarModal();
  def.f();
  window.scrollTo(0, 0);
  Array.prototype.forEach.call(document.querySelectorAll('#navInferior a'), function(a){
    a.classList.toggle('on', a.dataset.r === r);
  });
}
document.getElementById('btnAtras').onclick = function(){
  if (history.length > 1 && document.referrer !== undefined && sessionStorage.getItem('navego')) history.back();
  else location.hash = '#/';
};
window.addEventListener('hashchange', function(){ try{ sessionStorage.setItem('navego', '1'); }catch(e){} ir(); });

/* ---------- modal ---------- */
function abrirModal(html){
  document.getElementById('modalCuerpo').innerHTML = html;
  document.getElementById('modal').hidden = false;
}
function cerrarModal(){ document.getElementById('modal').hidden = true; }
document.getElementById('modal').onclick = function(e){ if (e.target.id === 'modal') cerrarModal(); };

/* ============================================================
   PANTALLAS
   ============================================================ */

/* ---------- INICIO ---------- */
function inicio(){
  var d = new Date(), L = diaLiturgico(d), ef = efemerides(d), mia = miParroquia();
  var rango = etiquetaRango(L.rango);
  var h = '';
  h += '<div class="card ordoMini" onclick="location.hash=\'#/ordo\'"><div class="banda" style="background:' + HEX[L.color] + ';' + (L.color === 'Blanco' ? 'box-shadow:inset -1px 0 0 var(--linea)' : '') + '"></div>';
  h += '<div class="fecha">' + esc(fechaLarga(d)) + '</div>';
  h += '<div class="celeb">' + esc(L.nombre) + '</div>';
  h += '<span class="pill"><span class="punto" style="background:' + HEX[L.color] + '"></span>' + esc(L.color) + '</span>';
  h += '<span class="pill">' + esc(rango || L.tiempo) + '</span>';
  if (L.salterio) h += '<span class="pill">Salterio ' + esc(L.salterio) + '</span>';
  if (L.opcionales.length) h += '<p class="extra">Memoria libre: ' + esc(L.opcionales.join(' · ')) + '</p>';
  if (ef.length) h += '<p class="extra">' + ef.slice(0, 3).map(function(e){ return e[0] + ' ' + esc(e[1]); }).join('<br>') + (ef.length > 3 ? '<br>…y ' + (ef.length - 3) + ' más' : '') + '</p>';
  h += '</div>';

  if (!esApp()) {
    h += '<a class="card aviso" style="display:block;text-decoration:none" href="#/instalar">📲 <b>Instale la app en su teléfono.</b> Toque aquí para ver cómo (iPhone o Android).</a>';
  }

  var T = [
    ['sacerdotes','👥','Sacerdotes', SACERDOTES.length + ' en el directorio'],
    ['parroquias','⛪','Parroquias', PARROQUIAS.length + ' parroquias'],
    ['ordo','📖','Ordo y Lecturas','Celebración y lecturas'],
    ['horas','🕯️','Liturgia de las Horas','Oficio, Laudes, Vísperas…'],
    ['notas','📝','Notas','Pendientes y apuntes'],
    ['hoy','☀️','Hoy','Todo lo del día', true],
    ['curia','🏛️','Curia','Teléfonos y extensiones'],
    ['noticias','📰','Noticias','Sitio diocesano'],
    ['bendiciones','✝️','Bendiciones','Ritos breves'],
    ['sacramentos','🕊️','Sacramentos','Requisitos y trámites'],
    ['calendario','🗓️','Calendario','Agenda diocesana'],
    ['misas','🔔','Misas del día','Próximas misas'],
    ['__mi','📍','Mi parroquia', mia ? esc(mia.muni + ' · ' + nombreCorto(mia)) : 'Toque para elegir']
  ];
  h += '<div class="rejilla">';
  T.forEach(function(t){
    var href = t[0] === '__mi' ? 'javascript:elegirParroquia()' : '#/' + t[0];
    h += '<a class="tarjeta' + (t[4] ? ' dest' : '') + '" href="' + href + '"><span class="em">' + t[1] + '</span><b>' + t[2] + '</b><small>' + t[3] + '</small></a>';
  });
  h += '</div>';
  h += '<p class="vacio" style="text-align:center;font-size:12px;font-style:normal">Diócesis de Socorro y San Gil · <a href="privacidad.html">Política de privacidad</a></p>';
  vista.innerHTML = h;
}

/* ---------- HOY ---------- */
function hoy(){
  var d = new Date(), L = diaLiturgico(d), rango = etiquetaRango(L.rango), ef = efemerides(d);
  var doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  var pq = PARROQUIAS[doy % PARROQUIAS.length];
  var parroco = pq.parroco ? pq.parroco.split('\n')[0] : 'su párroco';
  var h = '<div class="card" style="border-left:5px solid var(--oro)"><div class="eti" style="margin-bottom:2px">' + esc(fechaLarga(d)) + '</div>';
  h += '<div style="font:600 22px/1.25 var(--serif);margin:6px 0 10px">' + esc(L.nombre) + '</div>';
  h += '<span class="pill"><span class="punto" style="background:' + HEX[L.color] + '"></span>' + esc(L.color) + '</span>';
  if (rango) h += '<span class="pill">' + rango + '</span>';
  h += '<span class="pill">' + esc(L.tiempo) + '</span>';
  if (L.salterio) h += '<span class="pill">Salterio ' + L.salterio + '</span>';
  h += '<div><a class="btn rojo" href="https://www.dominicos.org/predicacion/evangelio-del-dia/hoy/" target="_blank" rel="noopener">📖 Lecturas de hoy</a>';
  h += '<a class="btn sec" href="#/horas">🕯️ Liturgia de las Horas</a></div></div>';

  if (L.opcionales.length){
    h += '<div class="card"><div class="eti">También se puede celebrar</div><ul class="lista">';
    L.opcionales.forEach(function(o){ h += '<li><span>•</span><span>' + esc(o) + '</span></li>'; });
    h += '</ul></div>';
  }
  h += '<div class="card"><div class="eti">Nuestra Diócesis hoy</div>';
  if (!ef.length) h += '<p class="vacio">Hoy no hay fiestas ni aniversarios registrados.</p>';
  else { h += '<ul class="lista">'; ef.forEach(function(e){ h += '<li><span>' + e[0] + '</span><span>' + esc(e[1]) + '</span></li>'; }); h += '</ul>'; }
  h += '</div>';

  h += '<div class="card"><div class="eti">Oramos hoy</div><p style="margin:0">Oramos por la <strong>' + esc(pq.nombre) + '</strong> de ' + esc(pq.muni) + ', por ' + esc(parroco) + ' y por toda la comunidad que allí se reúne.</p></div>';

  // Pendientes (mismos datos que guarda la pantalla Notas)
  var hoyIso = iso(d), lis = '';
  try {
    (JSON.parse(leer('tareas') || '[]') || []).forEach(function(t){
      var f = t.dia || '';
      if (!f || f <= hoyIso){
        var atr = (!t.ok && f && f < hoyIso) ? ' · atrasada' : (!f ? ' · sin fecha' : '');
        lis += '<li><span>' + (t.ok ? '✅' : '⬜') + '</span><span' + (t.ok ? ' style="color:var(--suave);text-decoration:line-through"' : '') + '>' + esc(t.t) + atr + '</span></li>';
      }
    });
  } catch(e){}
  h += '<div class="card"><div class="eti">Mis pendientes de hoy</div>';
  h += lis ? '<ul class="lista">' + lis + '</ul>' : '<p class="vacio">No tiene pendientes marcados para hoy.</p><div class="nota">Lo que anote en <a href="#/notas">Notas</a> aparece aquí.</div>';
  h += '</div>';

  h += '<div class="card"><div class="eti">Agenda diocesana</div><p style="margin:0;font-size:14px">Los eventos de la Curia y de la diócesis están en el calendario oficial.</p>';
  h += '<a class="btn" href="#/calendario">🗓️ Ver la agenda</a></div>';
  vista.innerHTML = h;
}

/* ---------- SACERDOTES ---------- */
function iniciales(nombre){
  var p = nombre.replace(/^(Pbro\.|Mons\.|Fr\.|Excmo\.|Mons)\s*/i, '').split(' ').filter(function(x){ return x.length > 2; });
  return ((p[0] || 'P').charAt(0) + (p[p.length > 2 ? 2 : 1] || '').charAt(0)).toUpperCase();
}
function sacerdotes(){
  vista.innerHTML = '<input class="buscar" id="q" type="search" placeholder="Buscar por nombre o lugar…" autocomplete="off">' +
    '<div class="contador" id="cont"></div><div class="card" id="lista" style="padding-top:4px;padding-bottom:4px"></div>';
  var q = document.getElementById('q');
  function pintar(){
    var t = sinTildes(q.value), l = SACERDOTES.filter(function(s){ return !t || sinTildes(s.nombre + ' ' + s.ubic).indexOf(t) >= 0; });
    document.getElementById('cont').textContent = l.length + (l.length === 1 ? ' sacerdote' : ' sacerdotes');
    document.getElementById('lista').innerHTML = l.length ? l.map(function(s){
      return '<div class="persona" onclick="fichaSacerdote(' + s.n + ')"><div class="avatar">' + esc(iniciales(s.nombre)) + '</div><div class="tx"><b>' + esc(s.nombre) + '</b><small>' + esc(s.ubic || 'Sacerdote diocesano') + '</small></div><span class="fl" style="color:var(--suave)">›</span></div>';
    }).join('') : '<p class="vacio" style="padding:12px 0">Ningún sacerdote coincide con la búsqueda.</p>';
  }
  q.oninput = pintar; pintar();
}
function fichaSacerdote(n){
  var s = SACERDOTES.filter(function(x){ return x.n === n; })[0]; if (!s) return;
  var e = aniosDesde(s.nac), o = aniosDesde(s.ord);
  abrirModal('<h2>' + esc(s.nombre) + '</h2>' +
    '<div class="dato"><span>📍</span><div>' + esc(s.ubic || 'Sacerdote diocesano') + '</div></div>' +
    '<div class="dato"><span>🎂</span><div>Nacimiento: ' + esc(s.nac) + (e != null ? ' <b>(' + e + ' años)</b>' : '') + '</div></div>' +
    '<div class="dato"><span>✝️</span><div>Ordenación: ' + esc(s.ord) + (o != null ? ' <b>(' + o + ' años de sacerdocio)</b>' : '') + '</div></div>' +
    '<button class="btn sec ancho" onclick="cerrarModal()">Cerrar</button>');
}

/* ---------- PARROQUIAS ---------- */
function parroquias(){
  vista.innerHTML = '<input class="buscar" id="q" type="search" placeholder="Buscar municipio, parroquia o sacerdote…" autocomplete="off">' +
    '<div class="contador" id="cont"></div><div class="card" id="lista" style="padding-top:4px;padding-bottom:4px"></div>';
  var q = document.getElementById('q');
  function pintar(){
    var t = sinTildes(q.value), l = PARROQUIAS.filter(function(p){ return !t || sinTildes(p.nombre + ' ' + p.muni + ' ' + p.parroco).indexOf(t) >= 0; });
    document.getElementById('cont').textContent = l.length + (l.length === 1 ? ' parroquia' : ' parroquias');
    document.getElementById('lista').innerHTML = l.length ? l.map(function(p){
      return '<div class="persona" onclick="fichaParroquia(' + p.n + ')"><div class="avatar az">⛪</div><div class="tx"><b>' + esc(nombreCorto(p)) + '</b><small>📍 ' + esc(p.muni) + '</small></div><span style="color:var(--suave)">›</span></div>';
    }).join('') : '<p class="vacio" style="padding:12px 0">Ninguna parroquia coincide con la búsqueda.</p>';
  }
  q.oninput = pintar; pintar();
}
function fichaParroquia(n){
  var p = PARROQUIAS.filter(function(x){ return x.n === n; })[0]; if (!p) return;
  var pub = function(v){ return v && !/sin publicar/i.test(v); };
  var h = '<h2>' + esc(p.nombre) + '</h2>';
  h += '<div class="dato"><span>📍</span><div>' + esc(p.muni) + '</div></div>';
  if (p.parroco) h += '<div class="dato"><span>👤</span><div>' + esc(p.parroco) + '</div></div>';
  if (p.dir) h += '<div class="dato"><span>🏠</span><div>' + esc(p.dir) + '</div></div>';
  if (p.tel) h += '<div class="dato"><span>📞</span><div>' + esc(p.tel) + '</div></div>';
  if (p.email) h += '<div class="dato"><span>✉️</span><div><a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a></div></div>';
  if (pub(p.misas)) h += '<div class="dato"><span>⛪</span><div><b>Misas</b>\n' + esc(p.misas) + '</div></div>';
  if (pub(p.despacho)) h += '<div class="dato"><span>🕐</span><div><b>Despacho</b>\n' + esc(p.despacho) + '</div></div>';
  h += '<div>';
  if (p.tel) h += '<a class="btn" href="tel:' + soloDigitos(p.tel, 10) + '">📞 Llamar</a>';
  h += '<a class="btn sec" href="' + mapa(destinoDe(p)) + '" target="_blank" rel="noopener">🗺️ Cómo llegar</a>';
  h += '<button class="btn sec" onclick="fijarParroquia(' + p.n + ')">📍 Es mi parroquia</button></div>';
  h += '<button class="btn sec ancho" onclick="cerrarModal()">Cerrar</button>';
  abrirModal(h);
}

/* ---------- elegir mi parroquia ---------- */
function elegirParroquia(){
  var mia = miParroquia(), h = '<h2>Elija su parroquia</h2>';
  PARROQUIAS.slice().sort(function(a, b){ return a.muni.localeCompare(b.muni, 'es'); }).forEach(function(p){
    h += '<button class="opcion' + (mia && mia.n === p.n ? ' on' : '') + '" onclick="fijarParroquia(' + p.n + ')">' + esc(p.muni) + ' — ' + esc(nombreCorto(p)) + '</button>';
  });
  h += '<div style="display:flex;gap:8px"><button class="btn sec" style="flex:1" onclick="fijarParroquia(0)">Quitar</button><button class="btn sec" style="flex:1" onclick="cerrarModal()">Cancelar</button></div>';
  abrirModal(h);
}
function fijarParroquia(n){
  if (n) guardar('miParroquia', String(n)); else { try{ localStorage.removeItem('miParroquia'); }catch(e){} }
  cerrarModal(); ir();
}

/* ---------- ORDO ---------- */
var ordoDesfase = 0;
function ordo(){
  var hoyD = new Date(), d = new Date(hoyD.getFullYear(), hoyD.getMonth(), hoyD.getDate() + ordoDesfase);
  var L = diaLiturgico(d), rango = etiquetaRango(L.rango), ef = efemerides(d);
  var h = '<div class="navDia"><button onclick="ordoMover(-1)" aria-label="Día anterior">‹</button>' +
    '<div class="centro">' + (ordoDesfase === 0 ? 'Hoy' : ordoDesfase === 1 ? 'Mañana' : ordoDesfase === -1 ? 'Ayer' : esc(DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES_C[d.getMonth()])) +
    (ordoDesfase !== 0 ? ' · <a href="javascript:ordoMover(0)" style="color:var(--suave);font-weight:400">volver a hoy</a>' : '') + '</div>' +
    '<button onclick="ordoMover(1)" aria-label="Día siguiente">›</button></div>';
  h += '<div class="card" style="border-top:6px solid ' + HEX[L.color] + '"><div class="eti">' + esc(fechaLarga(d)) + '</div>';
  h += '<div style="font:600 23px/1.25 var(--serif);margin:4px 0 10px">' + esc(L.nombre) + '</div>';
  h += '<span class="pill"><span class="punto" style="background:' + HEX[L.color] + '"></span>Color ' + esc(L.color.toLowerCase()) + '</span>';
  if (rango) h += '<span class="pill">' + rango + '</span>';
  h += '<span class="pill">' + esc(L.tiempo) + '</span>';
  if (L.salterio) h += '<span class="pill">Salterio: semana ' + L.salterio + '</span>';
  if (L.aproximado) h += '<p class="extra">Para este año solo se muestra el tiempo litúrgico (sin santoral).</p>';
  if (ordoDesfase === 0) h += '<div><a class="btn rojo" href="https://www.dominicos.org/predicacion/evangelio-del-dia/hoy/" target="_blank" rel="noopener">📖 Lecturas y evangelio de hoy</a></div>';
  h += '</div>';
  if (L.opcionales.length){
    h += '<div class="card"><div class="eti">Memorias libres</div><ul class="lista">';
    L.opcionales.forEach(function(o){ h += '<li><span>•</span><span>' + esc(o) + '</span></li>'; });
    h += '</ul></div>';
  }
  if (ef.length){
    h += '<div class="card"><div class="eti">Nuestra Diócesis este día</div><ul class="lista">';
    ef.forEach(function(e){ h += '<li><span>' + e[0] + '</span><span>' + esc(e[1]) + '</span></li>'; });
    h += '</ul></div>';
  }
  h += '<div class="card"><div class="eti">Próximos días</div>';
  for (var i = 1; i <= 7; i++){
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i), Lx = diaLiturgico(x);
    h += '<div class="fila" onclick="ordoMover(' + (ordoDesfase + i) + ', true)" style="cursor:pointer"><span class="punto" style="background:' + HEX[Lx.color] + ';width:13px;height:13px"></span>' +
      '<div class="tx"><b>' + esc(Lx.nombre) + '</b><small>' + esc(DIAS[x.getDay()] + ' ' + x.getDate() + ' de ' + MESES[x.getMonth()]) + (Lx.rango ? ' · ' + etiquetaRango(Lx.rango) : '') + '</small></div></div>';
  }
  h += '<div class="nota">Fuente: calendario litúrgico de Colombia (GCatholic), con los propios de la Conferencia Episcopal.</div></div>';
  vista.innerHTML = h;
}
function ordoMover(n, absoluto){ ordoDesfase = absoluto ? n : (n === 0 ? 0 : ordoDesfase + n); ordo(); window.scrollTo(0, 0); }

/* ---------- LITURGIA DE LAS HORAS ---------- */
var HORAS = [['oficio','Oficio'],['laudes','Laudes'],['tercia','Tercia'],['sexta','Sexta'],['nona','Nona'],['visperas','Vísperas'],['completas','Completas']];
function horaSugerida(){ var h = new Date().getHours();
  return h < 5 ? 'oficio' : h < 9 ? 'laudes' : h < 11 ? 'tercia' : h < 14 ? 'sexta' : h < 17 ? 'nona' : h < 20 ? 'visperas' : 'completas'; }
function urlHora(hora){ var d = new Date();
  return 'https://liturgiadelashoras.github.io/sync/' + d.getFullYear() + '/' + MESES_C[d.getMonth()] + '/' + pad(d.getDate()) + '/' + hora + '.htm'; }
function horas(){
  var h = '<div class="pestanas" id="pest">';
  HORAS.forEach(function(x){ h += '<button data-h="' + x[0] + '">' + x[1] + '</button>'; });
  h += '</div><div class="pieMarco"><span id="pieH"></span><a id="abrirH" target="_blank" rel="noopener">Abrir aparte ↗</a></div>';
  h += '<iframe class="marcoWeb" id="marcoH" title="Liturgia de las Horas"></iframe>';
  vista.innerHTML = h;
  function cargar(hora){
    Array.prototype.forEach.call(document.querySelectorAll('#pest button'), function(b){ b.classList.toggle('on', b.dataset.h === hora); });
    var u = urlHora(hora);
    document.getElementById('marcoH').src = u;
    document.getElementById('abrirH').href = u;
    document.getElementById('pieH').textContent = 'liturgiadelashoras.github.io';
  }
  Array.prototype.forEach.call(document.querySelectorAll('#pest button'), function(b){ b.onclick = function(){ cargar(b.dataset.h); }; });
  ajustarMarco('marcoH');
  cargar(horaSugerida());
}
function ajustarMarco(id){
  function f(){ var el = document.getElementById(id); if (!el) return;
    var top = el.getBoundingClientRect().top + window.scrollY;
    var nav = document.getElementById('navInferior').offsetHeight;
    el.style.height = Math.max(300, window.innerHeight - top - nav) + 'px'; }
  f(); setTimeout(f, 50);
}
window.addEventListener('resize', function(){ ['marcoH','marcoC','marcoN'].forEach(function(id){ if (document.getElementById(id)) ajustarMarco(id); }); });

/* ---------- CALENDARIO ---------- */
function calendario(){
  var src = 'https://calendar.google.com/calendar/embed?src=diocesissocorrosangil%40gmail.com&ctz=America%2FBogota&hl=es&mode=AGENDA&showTitle=0&showPrint=0&showTabs=1&showCalendars=0';
  vista.innerHTML = '<div class="pieMarco"><span>Agenda oficial de la Diócesis</span><a href="https://calendar.google.com/calendar/embed?src=diocesissocorrosangil%40gmail.com&ctz=America%2FBogota&hl=es" target="_blank" rel="noopener">Abrir en Google Calendar ↗</a></div>' +
    '<iframe class="marcoWeb" id="marcoC" title="Calendario diocesano" src="' + src + '"></iframe>';
  ajustarMarco('marcoC');
}

/* ---------- NOTICIAS ---------- */
function noticias(){
  vista.innerHTML = '<div class="card" style="text-align:center;padding:26px 18px">' +
    '<img src="escudo.png" alt="" style="height:84px;margin-bottom:10px">' +
    '<h2 style="font:600 19px var(--serif);margin:0 0 6px">Noticias de la Diócesis</h2>' +
    '<p style="color:var(--suave);font-size:14px;margin:0 0 6px">Las noticias, comunicados y publicaciones están en el sitio web oficial.</p>' +
    '<a class="btn rojo ancho" href="https://www.diocesisdesocorroysangil.org" target="_blank" rel="noopener">📰 Abrir el sitio diocesano</a>' +
    '<a class="btn sec ancho" href="https://www.diocesisdesocorroysangil.org/calendario-diocesano" target="_blank" rel="noopener">🗓️ Calendario en el sitio web</a></div>';
}

/* ---------- BENDICIONES ---------- */
function bendiciones(){
  var h = '<div class="card"><div class="eti">Bendiciones</div><p style="margin:0;font-size:13.5px;color:var(--suave)">Ritos breves para el ministerio diario. Toque una bendición para abrirla.</p></div><div class="card">';
  BENDICIONES.forEach(function(b, i){
    var pr = b.p.map(function(x){ return '<li><span>—</span><span>' + esc(x) + ' <em style="color:var(--suave)">R.</em></span></li>'; }).join('');
    h += '<div class="acc" id="b' + i + '"><button onclick="alternar(this)">' + esc(b.t) + ' <span class="fl">▶</span></button><div class="cuerpo">' +
      '<div class="rub">Monición</div><p style="margin:0">' + esc(b.m) + '</p>' +
      '<div class="rub">Lectura sugerida</div><p class="cita" style="margin:0">' + esc(b.l) + '</p>' +
      '<div class="rub">Exhortación</div><p style="margin:0">' + esc(b.e) + '</p>' +
      '<div class="rub">Preces</div><p style="margin:0;font-size:13.5px;color:var(--suave)">Digamos todos: <em>' + esc(b.pr) + '</em></p><ul class="lista">' + pr + '</ul>' +
      '<div class="rub">Oración de bendición</div><p class="orat">' + esc(b.o) + '</p>' +
      '<div class="rub">Gesto</div><p class="cita" style="margin:0">' + esc(b.g) + '</p>' +
      '<div class="rub">Fórmula</div><p class="orat">' + esc(b.f) + '</p>' +
      '<div class="nota">' + esc(b.n) + '</div></div></div>';
  });
  h += '</div><div class="card"><div class="nota" style="border:0;padding:0;margin:0">Textos propios de la Diócesis de Socorro y San Gil. Quien disponga del <em>Bendicional</em> puede usar las fórmulas aprobadas allí; estos ritos sirven cuando no se tiene el libro a mano.</div></div>';
  vista.innerHTML = h;
}
function alternar(b){ b.parentElement.classList.toggle('abierto'); }

/* ---------- SACRAMENTOS ---------- */
function sacramentos(){
  vista.innerHTML = '<div class="sacr">' + SACRAMENTOS_HTML.replace(/onclick="toggle\(this\)"/g, 'onclick="alternar(this)"') + '</div>';
}

/* ---------- NOTAS ---------- */
function notas(){
  vista.innerHTML = '<iframe class="marcoWeb" id="marcoN" title="Notas" src="notas.html" style="background:var(--fondo)"></iframe>';
  ajustarMarco('marcoN');
}

/* ---------- MISAS ---------- */
function filaMisa(m, d, conMuni){
  return '<a class="fila" href="' + mapa(destinoDe(m.p)) + '" target="_blank" rel="noopener"><div class="hora">' + horaTexto(m.min) + '</div><div class="tx"><b>' + esc(nombreCorto(m.p)) + '</b><small>' +
    (conMuni ? esc(m.p.muni) : '') + (m.nota ? (conMuni ? ' · ' : '') + esc(m.nota) : '') + '</small></div><div class="falta">' + faltaTexto(m.min, d) + '</div></a>';
}
function misas(){
  var d = new Date(), dow = d.getDay(), ahora = ahoraMin(d), nd = DIAS[dow], mia = miParroquia();
  var h = '<div class="card"><div class="eti">Mi parroquia</div>';
  if (!mia){
    h += '<p class="vacio">Todavía no ha elegido su parroquia.</p><button class="btn" onclick="elegirParroquia()">Elegir parroquia</button>';
  } else {
    h += '<p style="margin:0 0 2px"><strong>' + esc(mia.nombre) + '</strong></p><p style="margin:0;color:var(--suave);font-size:13px">' + esc(mia.muni) + '</p>';
    var mias = misasDe(mia).filter(function(m){ return m.dia === dow; }).sort(function(a, b){ return a.min - b.min; });
    if (!mias.length) h += '<p class="vacio" style="margin-top:10px">No hay misas publicadas para hoy ' + nd + '.</p>';
    else {
      h += '<div style="margin-top:6px">';
      mias.forEach(function(m){ var pas = m.min < ahora;
        h += '<div class="fila"' + (pas ? ' style="opacity:.45"' : '') + '><div class="hora">' + horaTexto(m.min) + '</div><div class="tx"><small>' + esc(m.nota || (pas ? 'ya celebrada' : 'hoy')) + '</small></div><div class="falta">' + faltaTexto(m.min, d) + '</div></div>'; });
      h += '</div>';
    }
    if (mia.tel) h += '<a class="btn" href="tel:' + soloDigitos(mia.tel, 10) + '">Llamar</a>';
    h += '<a class="btn sec" href="' + mapa(destinoDe(mia)) + '" target="_blank" rel="noopener">Cómo llegar</a><button class="btn sec" onclick="elegirParroquia()">Cambiar</button>';
  }
  h += '</div>';
  var prox = todasMisas().filter(function(m){ return m.dia === dow && m.min >= ahora; }).sort(function(a, b){ return a.min - b.min; });
  if (mia){
    var muni = prox.filter(function(m){ return m.p.muni === mia.muni && m.p.n !== mia.n; });
    if (muni.length){ h += '<div class="card"><div class="eti">Más tarde en ' + esc(mia.muni) + '</div>'; muni.slice(0, 8).forEach(function(m){ h += filaMisa(m, d, false); }); h += '</div>'; }
  }
  var resto = prox.filter(function(m){ return !mia || m.p.n !== mia.n; });
  h += '<div class="card"><div class="eti">Próximas misas hoy en la diócesis</div>';
  h += resto.length ? resto.slice(0, 15).map(function(m){ return filaMisa(m, d, true); }).join('') : '<p class="vacio">No quedan misas publicadas para hoy ' + nd + '.</p>';
  h += '<div class="nota">Los horarios son los publicados por cada parroquia. Pueden cambiar por fiestas o imprevistos: si va desde lejos, confirme por teléfono.</div></div>';
  vista.innerHTML = h;
}

/* ---------- CURIA ---------- */
function curia(){
  var ext = [['Secretaría Episcopal','111','Atención al despacho del señor Obispo'],['Vicaría General','109','Gobierno pastoral de la Diócesis'],
    ['Vicaría de Pastoral y Vicaría de San Gil','108','Acompañamiento de la acción pastoral'],['Cancillería y Corrección de Partidas','104','Partidas, certificados y archivo diocesano'],
    ['Tribunal Eclesiástico','105','Procesos canónicos y sala de atención prejudicial'],['Tesorería','102','Administración de bienes y aportes'],
    ['Cooperativa Diocesana del Clero','103','Servicios cooperativos para el clero'],['Casa de Encuentros y Fondo de Previsión del Clero','107','Retiros, encuentros y previsión'],
    ['Librería Juan Pablo II','112','Libros, artículos religiosos y material pastoral']];
  var dir = [['Curia Diocesana','3202477708',''],['Tribunal Eclesiástico','3102374393',''],['SEPAS','6077242573','Secretariado de Pastoral Social'],
    ['IDEAR','6077242543',''],['Seminario Conciliar San Carlos Borromeo','6077242087','También 311 2379345'],['Casa de Encuentros La Anunciación','6077242253',''],
    ['Cooperativa COOPCLERO','6077235524',''],['Fondo de Previsión del Clero','6077237779',''],['Fax de la Curia','6077242204','']];
  var pag = [['Quiénes somos','https://diocesisdesocorroysangil.org/qui%C3%A9nes-somos','🏛️'],['Nuestro Obispo','https://diocesisdesocorroysangil.org/obispo','⛪'],
    ['Consejo Episcopal','https://diocesisdesocorroysangil.org/consejo-episcopal','👥'],['Cancillería','https://diocesisdesocorroysangil.org/canciller%C3%ADa','📜'],
    ['Tribunal Eclesiástico','https://diocesisdesocorroysangil.org/tribunal-eclesi%C3%A1stico','⚖️'],['Oficina de Acogida, Escucha y Acompañamiento','https://diocesisdesocorroysangil.org/cultura-del-cuidado','🤲'],
    ['Casa de Encuentros','https://diocesisdesocorroysangil.org/casa-de-encuentros','🏡'],['Cementerio San Gil','https://diocesisdesocorroysangil.org/cementerio-san-gil','🕯️'],
    ['Instituto del Páramo','https://institutoparamo.com/','🎓'],['Directorio completo','https://diocesisdesocorroysangil.org/directorio','📇']];
  function bonito(n){ return n.slice(0,3) + ' ' + n.slice(3,6) + ' ' + n.slice(6); }
  var h = '<div class="card"><div class="eti">Conmutador de la Curia</div><p style="margin:0 0 4px;font-size:14px">607 724 2205 · 607 723 6019 · 320 247 7708</p>' +
    '<p style="margin:0;color:var(--suave);font-size:12.5px">Marque el conmutador y pida la extensión.</p>' +
    '<a class="btn" href="tel:6077242205">Llamar a la Curia</a><a class="btn sec" href="tel:3202477708">Celular</a></div>';
  h += '<div class="card"><div class="eti">Dependencias y extensiones</div>';
  ext.forEach(function(x){ h += '<a class="fila" href="tel:6077242205"><div class="tx"><b>' + x[0] + '</b><small>' + x[2] + '</small></div><div class="ext">Ext. ' + x[1] + '</div></a>'; });
  h += '<div class="nota">Al tocar una dependencia se marca el conmutador; luego digite la extensión.</div></div>';
  h += '<div class="card"><div class="eti">Líneas directas</div>';
  dir.forEach(function(x){ h += '<a class="fila" href="tel:' + x[1] + '"><div class="ico">📞</div><div class="tx"><b>' + x[0] + '</b><small>' + bonito(x[1]) + (x[2] ? ' · ' + x[2] : '') + '</small></div></a>'; });
  h += '</div>';
  h += '<div class="card"><div class="eti">Horario de atención</div>' +
    '<div class="fila"><div class="ico">🕐</div><div class="tx"><b>Lunes</b><small>8:45 a.m. – 12:00 m. · 2:00 – 5:00 p.m.</small></div></div>' +
    '<div class="fila"><div class="ico">🕐</div><div class="tx"><b>Martes a viernes</b><small>7:30 a.m. – 12:00 m. · 2:00 – 5:00 p.m.</small></div></div>' +
    '<div class="fila"><div class="ico">🚫</div><div class="tx"><b>Sábado, domingo y lunes festivo</b><small>No hay servicio</small></div></div></div>';
  h += '<div class="card"><div class="eti">Correos</div>' +
    '<a class="fila" href="mailto:diocesissocorroysangil@yahoo.com"><div class="ico">✉️</div><div class="tx"><b>diocesissocorroysangil@yahoo.com</b></div></a>' +
    '<a class="fila" href="mailto:socorrodioc@cec.org.co"><div class="ico">✉️</div><div class="tx"><b>socorrodioc@cec.org.co</b></div></a></div>';
  h += '<div class="card"><div class="eti">En el sitio diocesano</div>';
  pag.forEach(function(x){ h += '<a class="fila" href="' + x[1] + '" target="_blank" rel="noopener"><div class="ico">' + x[2] + '</div><div class="tx"><b>' + x[0] + '</b></div><span class="fl">›</span></a>'; });
  h += '</div>';
  vista.innerHTML = h;
}

/* ---------- INSTALAR ---------- */
function esApp(){ return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
var eventoInstalar = null;
window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); eventoInstalar = e; });
function instalarAndroid(){ if (eventoInstalar){ eventoInstalar.prompt(); eventoInstalar = null; } }
function instalar(){
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var h = '';
  if (esApp()) h += '<div class="card aviso">✅ <b>La app ya está instalada</b> en este dispositivo.</div>';
  h += '<div class="card"' + (ios ? ' style="border:2px solid var(--oro)"' : '') + '><div class="eti">En iPhone o iPad</div>' +
    '<div class="paso"><span class="num">1</span><div>Abra esta página en <b>Safari</b> (no funciona desde Chrome ni desde Facebook).</div></div>' +
    '<div class="paso"><span class="num">2</span><div>Toque el botón <b>Compartir</b> <span style="display:inline-block;border:1.5px solid currentColor;border-radius:4px;padding:0 5px;font-size:12px">↑</span> abajo en la pantalla.</div></div>' +
    '<div class="paso"><span class="num">3</span><div>Baje y elija <b>«Agregar a pantalla de inicio»</b>.</div></div>' +
    '<div class="paso"><span class="num">4</span><div>Toque <b>Agregar</b>. Aparecerá el escudo de la Diócesis como una app más.</div></div></div>';
  h += '<div class="card"' + (!ios ? ' style="border:2px solid var(--oro)"' : '') + '><div class="eti">En Android</div>' +
    '<p style="margin:0 0 6px;font-size:14px">La forma más completa es la app de la Play Store. Si prefiere esta versión web:</p>' +
    '<div class="paso"><span class="num">1</span><div>Abra esta página en <b>Chrome</b>.</div></div>' +
    '<div class="paso"><span class="num">2</span><div>Toque el menú <b>⋮</b> y elija <b>«Instalar app»</b> o «Agregar a pantalla principal».</div></div>' +
    (eventoInstalar ? '<button class="btn rojo ancho" onclick="instalarAndroid()">Instalar ahora</button>' : '') + '</div>';
  h += '<div class="card"><div class="eti">Para compartir</div><p style="margin:0;font-size:14px">Envíe este enlace por WhatsApp a quien quiera instalarla:</p>' +
    '<p style="font-weight:600;word-break:break-all;margin:8px 0 0">' + esc(location.origin + location.pathname) + '</p>' +
    '<button class="btn" onclick="compartirApp()">Compartir enlace</button></div>';
  vista.innerHTML = h;
}
function compartirApp(){
  var url = location.origin + location.pathname, txt = 'App de la Diócesis de Socorro y San Gil: ' + url;
  if (navigator.share) navigator.share({title:'Diócesis de Socorro y San Gil', text:txt, url:url}).catch(function(){});
  else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function(){ alert('Enlace copiado'); });
}

/* ============================================================
   ARRANQUE
   ============================================================ */
ir();
// Si la app queda abierta y cambia el día, refrescar la pantalla
var _diaActual = clave(new Date());
document.addEventListener('visibilitychange', function(){
  if (!document.hidden && clave(new Date()) !== _diaActual){ _diaActual = clave(new Date()); ordoDesfase = 0; ir(); }
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); });
}
