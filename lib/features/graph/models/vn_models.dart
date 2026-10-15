// Modelos inmutables del editor Visual Novel: proyecto, nodos y aristas.
// Sin dependencias de Flutter: testeables en puro Dart.
// Cualquier cambio pasa por GraphController con copyWith.
import 'package:flutter/foundation.dart';

/// Tipo de nodo del canvas, con el mismo vocabulario de la referencia.
enum VnNodeType {
  /// Punto de entrada verde de la historia.
  start,

  /// Personaje visible (ej. Yui) con entrada y pose.
  sprite,

  /// Bocadillo de diálogo con hablante y texto.
  dialogue,

  /// Bifurcación con 2+ opciones (cyan normal, roja peligrosa).
  choice,

  /// Efecto o música de fondo.
  sound,
}

/// Opción elegible dentro de un nodo [VnNodeType.choice].
@immutable
class VnOption {
  /// Crea una opción de diálogo.
  const new({required this.label, required this.nextId, this.isDanger = false});

  /// Texto del botón, ej. '1: Believe her'.
  final String label;

  /// Id del nodo destino al elegirla.
  final String nextId;

  /// Si es true se pinta roja y su arista también.
  final bool isDanger;

  /// Serializa a JSON para guardado local.
  Map<String, Object?> toJson() => {
    'label': label,
    'nextId': nextId,
    'isDanger': isDanger,
  };

  /// Reconstruye desde JSON. Tolera mapas parciales.
  factory VnOption.fromJson(Map<String, dynamic> json) => VnOption(
    label: json['label'] as String? ?? '',
    nextId: json['nextId'] as String? ?? '',
    isDanger: json['isDanger'] as bool? ?? false,
  );

  @override
  bool operator ==(Object other) =>
      other is VnOption &&
      other.label == label &&
      other.nextId == nextId &&
      other.isDanger == isDanger;

  @override
  int get hashCode => Object.hash(label, nextId, isDanger);
}

/// Nodo del grafo con posición en el canvas y payload según su tipo.
@immutable
class VnNode {
  /// Crea un nodo inmutable.
  const new({
    required this.id,
    required this.type,
    required this.title,
    required this.x,
    required this.y,
    this.speaker = '',
    this.text = '',
    this.pose = 'Happy',
    this.enterFrom = 'Enter Left',
    this.options = const [],
  });

  /// Identificador único estable (clave de widgets e índice).
  final String id;

  /// Tipo que define qué tarjeta se dibuja.
  final VnNodeType type;

  /// Título visible en la tarjeta.
  final String title;

  /// Posición X en coordenadas de escena.
  final double x;

  /// Posición Y en coordenadas de escena.
  final double y;

  /// Hablante del diálogo o dueño del sprite.
  final String speaker;

  /// Texto del diálogo.
  final String text;

  /// Pose del sprite (ej. 'Happy').
  final String pose;

  /// Animación de entrada (ej. 'Enter Left').
  final String enterFrom;

  /// Opciones si [type] es [VnNodeType.choice].
  final List<VnOption> options;

  /// Copia con los campos indicados reemplazados.
  VnNode copyWith({
    String? id,
    VnNodeType? type,
    String? title,
    double? x,
    double? y,
    String? speaker,
    String? text,
    String? pose,
    String? enterFrom,
    List<VnOption>? options,
  }) {
    return VnNode(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      x: x ?? this.x,
      y: y ?? this.y,
      speaker: speaker ?? this.speaker,
      text: text ?? this.text,
      pose: pose ?? this.pose,
      enterFrom: enterFrom ?? this.enterFrom,
      options: options ?? this.options,
    );
  }

  /// Serializa a JSON para guardado local.
  Map<String, Object?> toJson() => {
    'id': id,
    'type': type.name,
    'title': title,
    'x': x,
    'y': y,
    'speaker': speaker,
    'text': text,
    'pose': pose,
    'enterFrom': enterFrom,
    'options': options.map((o) => o.toJson()).toList(),
  };

  /// Reconstruye desde JSON. Tolera campos ausentes.
  factory VnNode.fromJson(Map<String, dynamic> json) {
    final typeName = json['type'] as String? ?? 'dialogue';
    final type = VnNodeType.values.firstWhere(
      (t) => t.name == typeName,
      orElse: () => VnNodeType.dialogue,
    );
    final rawOptions = json['options'] as List? ?? const [];
    return VnNode(
      id: json['id'] as String? ?? 'node',
      type: type,
      title: json['title'] as String? ?? '',
      x: (json['x'] as num?)?.toDouble() ?? 0,
      y: (json['y'] as num?)?.toDouble() ?? 0,
      speaker: json['speaker'] as String? ?? '',
      text: json['text'] as String? ?? '',
      pose: json['pose'] as String? ?? 'Happy',
      enterFrom: json['enterFrom'] as String? ?? 'Enter Left',
      options: rawOptions
          .whereType<Map<String, dynamic>>()
          .map(VnOption.fromJson)
          .toList(),
    );
  }

  @override
  bool operator ==(Object other) =>
      other is VnNode &&
      other.id == id &&
      other.type == type &&
      other.title == title &&
      other.x == x &&
      other.y == y &&
      other.speaker == speaker &&
      other.text == text &&
      other.pose == pose &&
      other.enterFrom == enterFrom &&
      listEquals(other.options, options);

  @override
  int get hashCode => Object.hash(
    id,
    type,
    title,
    x,
    y,
    speaker,
    text,
    pose,
    enterFrom,
    Object.hashAll(options),
  );
}

/// Conexión dirigida entre dos nodos.
@immutable
class VnEdge {
  /// Crea una arista inmutable.
  const new({
    required this.fromId,
    required this.toId,
    this.fromOption,
    this.isDanger = false,
  });

  /// Id del nodo origen.
  final String fromId;

  /// Etiqueta de opción si sale de un Choice.
  final String? fromOption;

  /// Id del nodo destino.
  final String toId;

  /// Si es true se dibuja roja.
  final bool isDanger;

  /// Serializa a JSON para guardado local.
  Map<String, Object?> toJson() => {
    'fromId': fromId,
    'fromOption': fromOption,
    'toId': toId,
    'isDanger': isDanger,
  };

  /// Reconstruye desde JSON.
  factory VnEdge.fromJson(Map<String, dynamic> json) => VnEdge(
    fromId: json['fromId'] as String? ?? '',
    fromOption: json['fromOption'] as String?,
    toId: json['toId'] as String? ?? '',
    isDanger: json['isDanger'] as bool? ?? false,
  );

  @override
  bool operator ==(Object other) =>
      other is VnEdge &&
      other.fromId == fromId &&
      other.fromOption == fromOption &&
      other.toId == toId &&
      other.isDanger == isDanger;

  @override
  int get hashCode => Object.hash(fromId, fromOption, toId, isDanger);
}

/// Proyecto completo: título + nodos + aristas.
@immutable
class VnProject {
  /// Crea un proyecto inmutable.
  const new({required this.title, required this.nodes, required this.edges});

  /// Proyecto demo que replica la imagen de referencia.
  factory demo() {
    final nodes = [
      const VnNode(
        id: 'start',
        type: VnNodeType.start,
        title: 'Start',
        x: 40,
        y: 260,
      ),
      const VnNode(
        id: 'sprite_yui',
        type: VnNodeType.sprite,
        title: 'Sprite: Yui',
        x: 220,
        y: 180,
        speaker: 'Yui',
      ),
      const VnNode(
        id: 'dlg_01',
        type: VnNodeType.dialogue,
        title: 'Dialogue - 01',
        x: 480,
        y: 200,
        speaker: 'Yui',
        text: 'Hey there! Did you hear about the rumor?',
      ),
      const VnNode(
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
      const VnNode(
        id: 'dlg_c',
        type: VnNodeType.dialogue,
        title: 'Dialogue - C',
        x: 1010,
        y: 120,
        speaker: 'Yui',
        text: 'Can true... Believe too?',
      ),
      const VnNode(
        id: 'dlg_l',
        type: VnNodeType.dialogue,
        title: 'Dialogue - L',
        x: 1010,
        y: 340,
        speaker: 'Yui',
        text: 'Hey th... Laugh.',
      ),
    ];
    const edges = [
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
  factory stress500() {
    final nodes = <VnNode>[];
    const cols = 25;
    for (var i = 0; i < 500; i++) {
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
      for (var i = 0; i < 499; i++) VnEdge(fromId: 'n_$i', toId: 'n_${i + 1}'),
    ];
    return VnProject(title: 'Stress 500', nodes: nodes, edges: edges);
  }

  /// Proyecto nuevo vacío: solo el nodo Start.
  factory VnProject.blank({String title = 'Nuevo proyecto'}) {
    return VnProject(
      title: title,
      nodes: const [
        VnNode(id: 'start', type: VnNodeType.start, title: 'Start', x: 40, y: 260),
      ],
      edges: const [],
    );
  }

  /// Título visible en el AppBar y en el HTML exportado.
  final String title;

  /// Nodos del canvas.
  final List<VnNode> nodes;

  /// Aristas del canvas.
  final List<VnEdge> edges;

  /// Serializa a JSON para guardado local.
  Map<String, Object?> toJson() => {
    'title': title,
    'nodes': nodes.map((n) => n.toJson()).toList(),
    'edges': edges.map((e) => e.toJson()).toList(),
  };

  /// Reconstruye desde JSON. Tolera listas ausentes.
  factory VnProject.fromJson(Map<String, dynamic> json) {
    final rawNodes = json['nodes'] as List? ?? const [];
    final rawEdges = json['edges'] as List? ?? const [];
    return VnProject(
      title: json['title'] as String? ?? 'Sin título',
      nodes: rawNodes
          .whereType<Map<String, dynamic>>()
          .map(VnNode.fromJson)
          .toList(),
      edges: rawEdges
          .whereType<Map<String, dynamic>>()
          .map(VnEdge.fromJson)
          .toList(),
    );
  }

  /// Copia con los campos indicados reemplazados.
  VnProject copyWith({
    String? title,
    List<VnNode>? nodes,
    List<VnEdge>? edges,
  }) {
    return VnProject(
      title: title ?? this.title,
      nodes: nodes ?? this.nodes,
      edges: edges ?? this.edges,
    );
  }

  /// Busca un nodo por id. Lanza [StateError] si no existe.
  VnNode byId(String id) => nodes.firstWhere((n) => n.id == id);
}
