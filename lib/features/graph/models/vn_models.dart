// Lógica de datos del editor Visual Novel: proyecto, nodos y aristas.
// Sin dependencias externas para compilar offline en Android, Linux, Windows y Web.
enum VnNodeType { start, sprite, dialogue, choice, sound }

class VnOption {
  String label;
  String nextId;
  bool isDanger;
  VnOption({required this.label, required this.nextId, this.isDanger = false});
}

class VnNode {
  String id;
  VnNodeType type;
  String title;
  double x;
  double y;
  // Payload genérico según tipo:
  String speaker;
  String text;
  String pose;
  String enterFrom;
  List<VnOption> options;
  VnNode({
    required this.id,
    required this.type,
    required this.title,
    required this.x,
    required this.y,
    this.speaker = '',
    this.text = '',
    this.pose = 'Happy',
    this.enterFrom = 'Enter Left',
    List<VnOption>? options,
  }) : options = options ?? [];
}

class VnEdge {
  String fromId;
  String? fromOption; // label de opción si sale de un Choice
  String toId;
  bool isDanger;
  VnEdge({
    required this.fromId,
    required this.toId,
    this.fromOption,
    this.isDanger = false,
  });
}

class VnProject {
  String title;
  List<VnNode> nodes;
  List<VnEdge> edges;
  VnProject({required this.title, required this.nodes, required this.edges});

  /// Proyecto demo que replica la imagen de referencia.
  factory VnProject.demo() {
    final nodes = [
      VnNode(
        id: 'start',
        type: VnNodeType.start,
        title: 'Start',
        x: 40,
        y: 260,
      ),
      VnNode(
        id: 'sprite_yui',
        type: VnNodeType.sprite,
        title: 'Sprite: Yui',
        x: 220,
        y: 180,
        speaker: 'Yui',
        pose: 'Happy',
        enterFrom: 'Enter Left',
      ),
      VnNode(
        id: 'dlg_01',
        type: VnNodeType.dialogue,
        title: 'Dialogue - 01',
        x: 480,
        y: 200,
        speaker: 'Yui',
        text: 'Hey there! Did you hear about the rumor?',
      ),
      VnNode(
        id: 'choice_01',
        type: VnNodeType.choice,
        title: 'Choices',
        x: 740,
        y: 200,
        options: [
          VnOption(label: '1: Believe her', nextId: 'dlg_c'),
          VnOption(label: '2: Laugh it off', nextId: 'dlg_l', isDanger: true),
        ],
      ),
      VnNode(
        id: 'dlg_c',
        type: VnNodeType.dialogue,
        title: 'Dialogue - C',
        x: 1010,
        y: 120,
        speaker: 'Yui',
        text: 'Can true... Believe too?',
      ),
      VnNode(
        id: 'dlg_l',
        type: VnNodeType.dialogue,
        title: 'Dialogue - L',
        x: 1010,
        y: 340,
        speaker: 'Yui',
        text: 'Hey th... Laugh.',
      ),
    ];
    final edges = [
      VnEdge(fromId: 'start', toId: 'sprite_yui'),
      VnEdge(fromId: 'sprite_yui', toId: 'dlg_01'),
      VnEdge(fromId: 'dlg_01', toId: 'choice_01'),
      VnEdge(fromId: 'choice_01', fromOption: '1: Believe her', toId: 'dlg_c'),
      VnEdge(
        fromId: 'choice_01',
        fromOption: '2: Laugh it off',
        toId: 'dlg_l',
        isDanger: true,
      ),
    ];
    return VnProject(title: 'My Novel', nodes: nodes, edges: edges);
  }

  /// Proyecto de estrés: 500 nodos en rejilla con aristas en cadena.
  /// Sirve para probar que el canvas no tira lag.
  factory VnProject.stress500() {
    final nodes = <VnNode>[];
    const cols = 25;
    for (int i = 0; i < 500; i++) {
      final col = i % cols;
      final row = i ~/ cols;
      nodes.add(
        VnNode(
          id: 'n_$i',
          type: VnNodeType.dialogue,
          title: 'Dlg - $i',
          x: 40.0 + col * 260,
          y: 40.0 + row * 170,
          speaker: 'Yui',
          text: 'Texto $i...',
        ),
      );
    }
    final edges = <VnEdge>[
      for (int i = 0; i < 499; i++) VnEdge(fromId: 'n_$i', toId: 'n_${i + 1}'),
    ];
    return VnProject(title: 'Stress 500', nodes: nodes, edges: edges);
  }

  VnNode byId(String id) => nodes.firstWhere((n) => n.id == id);
}
