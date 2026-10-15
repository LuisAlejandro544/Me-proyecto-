// Exportador HTML: genera una historia jugable autocontenida.
// Replica el botón Web .html de la imagen sin servidor ni dependencias.
import 'package:me_proyecto/features/graph/models/vn_models.dart';

/// Estilos del reproductor web (réplica oscura de la app).
const _css = '''
body{background:#0f172a;color:#e2e8f0;font-family:sans-serif}
body{display:flex;align-items:center;justify-content:center}
body{min-height:100vh;margin:0}
.card{background:#1e293b;border:1px solid #22d3ee}
.card{border-radius:12px;padding:24px;max-width:520px;width:90%}
button{background:#22d3ee;border:0;border-radius:8px}
button{padding:10px 16px;margin:6px 6px 0 0;cursor:pointer}
button.danger{background:#f87171;color:#1f2937}''';

/// Reproductor en JS vainilla: muestra nodos y avanza por aristas.
const _playerJs = '''
;let cur="start";
function show(){
const n=nodes[cur];
const t=document.getElementById("t");
const c=document.getElementById("c");
c.innerHTML="";
if(n.type==="choice"){
t.innerHTML="<b>Elige:</b>";
n.opts.forEach(o=>{
const b=document.createElement("button");
b.textContent=o.label;
if(o.danger)b.className="danger";
b.onclick=()=>{cur=o.next;show()};
c.appendChild(b)})}
else if(n.type==="dlg"){
t.innerHTML="<b>"+n.sp+":</b> "+n.tx;
const b=document.createElement("button");
b.textContent="Siguiente";
b.onclick=()=>{cur=n.next;show()};
c.appendChild(b)}
else{
t.innerHTML="Inicio";
const b=document.createElement("button");
b.textContent="Comenzar";
b.onclick=()=>{cur=n.next;show()};
c.appendChild(b)}
}
show()''';

/// Genera un HTML autocontenido con la historia jugable de [project].
String buildPlayableHtml(VnProject project) {
  final buf = StringBuffer()
    ..writeln('<!doctype html><html lang="es">')
    ..writeln('<head><meta charset="utf-8">')
    ..writeln(
      '<meta name="viewport" content="width=device-width,initial-scale=1">',
    )
    ..writeln('<title>${project.title}</title>')
    ..writeln('<style>')
    ..writeln(_css)
    ..writeln('</style></head>')
    ..writeln('<body><div class="card">')
    ..writeln('<h2>${project.title}</h2><div id="t"></div><div id="c"></div>')
    ..writeln('<script>const nodes={');
  for (final n in project.nodes) {
    buf.writeln(_nodeJs(project, n));
  }
  buf
    ..writeln(_playerJs)
    ..writeln('</script>')
    ..writeln('</div></body></html>');
  return buf.toString();
}

/// Serializa un nodo al formato que consume el reproductor JS.
String _nodeJs(VnProject project, VnNode n) {
  final next = _nextOf(project, n.id);
  switch (n.type) {
    case VnNodeType.choice:
      final opts = n.options.map(_optionJs).join(',');
      return "'${n.id}':{type:'choice',opts:[$opts]},";
    case VnNodeType.dialogue:
      final speaker = _js(n.speaker);
      final text = _js(n.text).replaceAll('\n', '<br>');
      return "'${n.id}':{type:'dlg',sp:'$speaker',"
          "tx:'$text',next:'$next'},";
    case VnNodeType.sprite:
      return "'${n.id}':{type:'spr',sp:'${n.speaker}',"
          "pose:'${n.pose}',next:'$next'},";
    case VnNodeType.start:
    case VnNodeType.sound:
      return "'${n.id}':{type:'start',next:'$next'},";
  }
}

/// Serializa una opción escapando comillas simples.
String _optionJs(VnOption o) {
  final label = _js(o.label);
  return "{label:'$label',next:'${o.nextId}',danger:${o.isDanger}}";
}

/// Escapa un texto para incrustarlo en un literal JS de comillas simples.
String _js(String s) => s.replaceAll("'", r"\'");

/// Id del nodo que sigue a [id] por la primera arista, o [id] si no hay.
String _nextOf(VnProject p, String id) {
  final e = p.edges.where((e) => e.fromId == id);
  if (e.isEmpty) return id;
  return e.first.toId;
}
