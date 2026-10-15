// Estado del grafo: proyecto, posiciones reactivas e índice O(1).
// La UI solo escucha notifiers: mover 1 nodo no reconstruye los demás
// y el canvas cacheado evita recorrer 500 nodos por frame.
import 'package:flutter/material.dart';

import '../models/vn_models.dart';

class GraphController extends ChangeNotifier {
  VnProject project;
  final Map<String, ValueNotifier<Offset>> posOf = {};
  final Map<String, VnNode> index = {};
  final ValueNotifier<int> edgeVersion = ValueNotifier(0);
  final ValueNotifier<int> viewVersion = ValueNotifier(0);
  Size canvasSize = const Size(1300, 640);
  int seq = 100;

  GraphController.demo() : project = VnProject.demo() {
    _rebuildAll();
  }

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
    double mx = 1300, my = 640;
    for (final n in project.nodes) {
      if (n.x + 320 > mx) mx = n.x + 320;
      if (n.y + 260 > my) my = n.y + 260;
    }
    canvasSize = Size(mx, my);
  }

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
          ? [
              VnOption(label: '1: Sí', nextId: 'dlg_c'),
              VnOption(label: '2: No', nextId: 'dlg_l', isDanger: true),
            ]
          : [],
    );
    project.nodes.add(n);
    index[id] = n;
    posOf[id] = ValueNotifier(Offset(n.x, n.y));
    _recacheCanvas();
    edgeVersion.value++;
    notifyListeners();
  }

  // Genera 500 nodos de una sola vez (1 solo rebuild).
  void stress500() {
    project = VnProject.stress500();
    seq = 1000;
    _rebuildAll();
    edgeVersion.value++;
    notifyListeners();
  }

  void restoreDemo() {
    project = VnProject.demo();
    seq = 100;
    _rebuildAll();
    edgeVersion.value++;
    notifyListeners();
  }

  void deleteNode(VnNode n) {
    project.nodes.removeWhere((e) => e.id == n.id);
    project.edges.removeWhere((e) => e.fromId == n.id || e.toId == n.id);
    index.remove(n.id);
    posOf.remove(n.id)?.dispose();
    _recacheCanvas();
    edgeVersion.value++;
    notifyListeners();
  }

  // Llamado al SOLTAR un arrastre: 1 repintado de aristas por gesto.
  void moveNode(VnNode n, double dx, double dy) {
    n.x += dx;
    n.y += dy;
    posOf[n.id]?.value = Offset(n.x, n.y);
    edgeVersion.value++;
  }

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
