// Exportador HTML: genera una historia jugable autocontenida.
// Replica el botón Web .html de la imagen sin servidor ni dependencias.
import '../models/vn_models.dart';

String buildPlayableHtml(VnProject project) {
  final buf = StringBuffer();
  buf.writeln('<!doctype html><html lang="es"><head><meta charset="utf-8">');
  buf.writeln('<meta name="viewport" content="width=device-width,initial-scale=1">');
  buf.writeln('<title>${project.title}</title>');
  buf.writeln('<style>body{background:#0f172a;color:#e2e8f0;font-family:sans-serif;display:flex;'
      'align-items:center;justify-content:center;min-height:100vh;margin:0}');
  buf.writeln('.card{background:#1e293b;border:1px solid #22d3ee;border-radius:12px;'
      'padding:24px;max-width:520px;width:90%}button{background:#22d3ee;border:0;'
      'border-radius:8px;padding:10px 16px;margin:6px 6px 0 0;cursor:pointer}'
      'button.danger{background:#f87171;color:#1f2937}</style></head><body><div class="card">');
  buf.writeln('<h2>${project.title}</h2><div id="t"></div><div id="c"></div>');
  buf.writeln('<script>const nodes={');
  for (final n in project.nodes) {
    final safeText = n.text.replaceAll("'", "\\'").replaceAll('\n', '<br>');
    if (n.type == VnNodeType.choice) {
      final opts = n.options
          .map((o) => "{label:'${o.label.replaceAll("'", "\\'")}',next:'${o.nextId}',danger:${o.isDanger}}")
          .join(',');
      buf.writeln("'${n.id}':{type:'choice',opts:[$opts]},");
    } else if (n.type == VnNodeType.dialogue) {
      buf.writeln("'${n.id}':{type:'dlg',sp:'${n.speaker}',tx:'$safeText',next:'${_nextOf(project, n.id)}'},");
    } else if (n.type == VnNodeType.sprite) {
      buf.writeln("'${n.id}':{type:'spr',sp:'${n.speaker}',pose:'${n.pose}',next:'${_nextOf(project, n.id)}'},");
    } else {
      buf.writeln("'${n.id}':{type:'start',next:'${_nextOf(project, n.id)}'},");
    }
  }
  buf.writeln('};let cur="start";function show(){const n=nodes[cur];const t=document.getElementById("t");'
      'const c=document.getElementById("c");c.innerHTML="";'
      'if(n.type==="choice"){t.innerHTML="<b>Elige:</b>";n.opts.forEach(o=>{'
      'const b=document.createElement("button");b.textContent=o.label;'
      'if(o.danger)b.className="danger";b.onclick=()=>{cur=o.next;show()};c.appendChild(b)})}'
      'else if(n.type==="dlg"){t.innerHTML="<b>"+n.sp+":</b> "+n.tx;'
      'const b=document.createElement("button");b.textContent="Siguiente";'
      'b.onclick=()=>{cur=n.next;show()};c.appendChild(b)}'
      'else{t.innerHTML=n.type==="spr"?("Sprite "+n.sp+" ("+n.pose+")"):"Inicio";'
      'const b=document.createElement("button");b.textContent="Comenzar";'
      'b.onclick=()=>{cur=n.next;show()};c.appendChild(b)}}show()</script>');
  buf.writeln('</div></body></html>');
  return buf.toString();
}

String _nextOf(VnProject p, String id) {
  final e = p.edges.where((e) => e.fromId == id);
  if (e.isEmpty) return id;
  return e.first.toId;
}
