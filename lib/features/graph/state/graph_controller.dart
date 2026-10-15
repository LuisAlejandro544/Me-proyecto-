// Estado del grafo: proyecto inmutable, posiciones reactivas e índice O(1).
// La UI solo escucha notifiers: mover 1 nodo no reconstruye los demás
// y el canvas cacheado evita recorrer 500 nodos por frame.
import 'package:flutter/material.dart';
import 'package:me_proyecto/features/graph/models/vn_models.dart';

/// Único dueño mutable del grafo. Emite [notifyListeners] en cambios
/// estructurales y [edgeVersion] en cambios de posición.
class GraphController extends ChangeNotifier {
  /// Crea el controlador con el proyecto demo.
  new demo() : project = VnProject.demo() {
    _rebuildAll();
  }

  /// Crea el controlador con un proyecto ya existente (cargado o nuevo).
  new fromProject(VnProject initial) : project = initial {
    _rebuildAll();
  }

  /// Proyecto actual (se reemplaza, nunca se muta).
  VnProject project;

  /// Posición reactiva por nodo: la UI se suscribe por id.
  final Map<String, ValueNotifier<Offset>> posOf = {};

  /// Índice id → nodo para búsquedas O(1).
  final Map<String, VnNode> index = {};

  /// Sube en cada cambio de datos; repinta aristas y recalcula culling.
  final ValueNotifier<int> edgeVersion = ValueNotifier(0);

  /// Sube al soltar pan/zoom; recalcula culling sin tocar datos.
  final ValueNotifier<int> viewVersion = ValueNotifier(0);

  /// Evita repintar aristas más de ~60 veces/seg durante el arrastre.
  DateTime _lastEdge = DateTime.fromMillisecondsSinceEpoch(0);

  /// Tamaño del canvas cacheado (se recalcula solo al cambiar datos).
  Size canvasSize = const Size(1300, 640);

  /// Contador para ids de nodos nuevos.
  int seq = 100;

  void _rebuildAll() {
    for (final v in posOf.values) {
      v.dispose();
    }
    posOf.clear();
    index.clear();
    for (final n in project.nodes) {
      index[n.id] = n;
      posOf[n.id] = ValueNotifier(Offset(n.x, n.y));
    }
    _recacheCanvas();
  }

  void _recacheCanvas() {
    var mx = 1300.0;
    var my = 640.0;
    for (final n in project.nodes) {
      if (n.x + 320 > mx) mx = n.x + 320;
      if (n.y + 260 > my) my = n.y + 260;
    }
    canvasSize = Size(mx, my);
  }

  /// Agrega un nodo del tipo dado junto al origen y notifica.
  void addNode(VnNodeType t) {
    seq++;
    final id = '${t.name}_$seq';
    final n = VnNode(
      id: id,
      type: t,
      title: '${t.name} - $seq',
      x: 300 + (seq % 5) * 40,
      y: 120 + (seq % 4) * 80,
      speaker: 'Yui',
      text: 'Nuevo texto...',
      options: t == VnNodeType.choice
          ? const [
              VnOption(label: '1: Sí', nextId: 'dlg_c'),
              VnOption(label: '2: No', nextId: 'dlg_l', isDanger: true),
            ]
          : const [],
    );
    project = project.copyWith(nodes: [...project.nodes, n]);
    index[id] = n;
    posOf[id] = ValueNotifier(Offset(n.x, n.y));
    _recacheCanvas();
    edgeVersion.value++;
    notifyListeners();
  }

  /// Genera 500 nodos de prueba de una sola vez (1 solo rebuild).
  void stress500() {
    project = VnProject.stress500();
    seq = 1000;
    _rebuildAll();
    edgeVersion.value++;
    notifyListeners();
  }

  /// Restaura el proyecto demo.
  void restoreDemo() {
    project = VnProject.demo();
    seq = 100;
    _rebuildAll();
    edgeVersion.value++;
    notifyListeners();
  }

  /// Borra el nodo y sus aristas sin dejar huérfanos. No falla si no existe.
  void deleteNode(VnNode n) {
    if (!index.containsKey(n.id)) return;
    project = project.copyWith(
      nodes: project.nodes.where((e) => e.id != n.id).toList(),
      edges: project.edges
          .where((e) => e.fromId != n.id && e.toId != n.id)
          .toList(),
    );
    index.remove(n.id);
    posOf.remove(n.id)?.dispose();
    _recacheCanvas();
    edgeVersion.value++;
    notifyListeners();
  }

  /// Mueve un nodo SIN repintar aristas en cada tick (arrastre en vivo).
  /// Las aristas se limitan a ~60 repintados/seg. Resuelve el objeto
  /// actual por id porque el widget puede tener una copia anterior.
  /// Llamar a [commitMove] al soltar para el repintado final garantizado.
  void previewMove(VnNode n, double dx, double dy) {
    final cur = index[n.id];
    if (cur == null) return;
    final updated = cur.copyWith(x: cur.x + dx, y: cur.y + dy);
    final nodes = [...project.nodes];
    nodes[nodes.indexWhere((e) => e.id == n.id)] = updated;
    project = project.copyWith(nodes: nodes);
    index[n.id] = updated;
    posOf[n.id]?.value = Offset(updated.x, updated.y);
    final now = DateTime.now();
    if (now.difference(_lastEdge).inMilliseconds >= 16) {
      _lastEdge = now;
      edgeVersion.value++;
    }
  }

  /// Repintado final garantizado al soltar el arrastre.
  void commitMove() {
    _lastEdge = DateTime.fromMillisecondsSinceEpoch(0);
    edgeVersion.value++;
  }

  /// Mueve un nodo con repintado inmediato (atajo para tests y código).
  /// No hace nada si el id no existe.
  void moveNode(VnNode n, double dx, double dy) {
    if (!index.containsKey(n.id)) return;
    previewMove(n, dx, dy);
    commitMove();
  }

  /// Recalcula el culling (llamado al soltar pan/zoom).
  void bumpView() => viewVersion.value++;

  @override
  void dispose() {
    for (final v in posOf.values) {
      v.dispose();
    }
    edgeVersion.dispose();
    viewVersion.dispose();
    super.dispose();
  }
}
