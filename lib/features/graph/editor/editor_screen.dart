// Pantalla del editor: UI fina sobre GraphController.
// Culling por viewport + arrastre con estado local + tokens AppColors.
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:me_proyecto/core/perf/fps_chip.dart';
import 'package:me_proyecto/core/theme/app_theme.dart';
import 'package:me_proyecto/features/assets/assets_screen.dart';
import 'package:me_proyecto/features/graph/editor/node_widgets.dart';
import 'package:me_proyecto/features/graph/editor/painters.dart';
import 'package:me_proyecto/features/graph/export/html_exporter.dart';
import 'package:me_proyecto/features/graph/models/vn_models.dart';
import 'package:me_proyecto/features/graph/player/player_screen.dart';
import 'package:me_proyecto/features/graph/state/graph_controller.dart';
import 'package:me_proyecto/features/projects/data/project_storage.dart';

/// Pantalla del editor de nodos sobre [GraphController].
class EditorScreen extends StatefulWidget {
  /// Crea la pantalla del editor.
  ///
  /// [initialProject] es el proyecto a editar (demo si es null).
  /// [slotIndex] es el slot local (0..2) donde se guarda. Si es null,
  /// al pulsar Guardar se pedirá elegir slot.
  const new({super.key, this.initialProject, this.slotIndex});

  /// Proyecto inicial para editar.
  final VnProject? initialProject;

  /// Slot de guardado asociado.
  final int? slotIndex;

  @override
  State<EditorScreen> createState() => _EditorScreenState();
}

class _EditorScreenState extends State<EditorScreen>
    with SingleTickerProviderStateMixin {
  late final GraphController graph;
  final TransformationController zoom = TransformationController();
  late final AnimationController _zoomAnim;
  Size _viewSize = Size.zero;
  int lastVisible = 0;
  int? _slot;
  bool _saving = false;
  bool _dirty = false;

  @override
  void initState() {
    super.initState();
    graph = widget.initialProject == null
        ? GraphController.demo()
        : GraphController.fromProject(widget.initialProject!);
    _slot = widget.slotIndex;
    graph.addListener(_onGraphChanged);
    _zoomAnim = AnimationController(
      duration: const Duration(milliseconds: 220),
      vsync: this,
    );
  }

  void _onGraphChanged() {
    _dirty = true;
    if (mounted) setState(() {});
  }

  /// Guarda el proyecto actual en el slot local.
  /// Si no hay slot asignado, pide elegir uno (1..3).
  Future<void> _save() async {
    if (_saving) return;
    var slot = _slot;
    if (slot == null) {
      slot = await _pickSlot();
      if (slot == null) return;
    }
    setState(() => _saving = true);
    try {
      final storage = await ProjectStorage.load();
      await storage.saveSlot(slot, graph.project);
      if (!mounted) return;
      setState(() {
        _slot = slot;
        _dirty = false;
        _saving = false;
      });
      _snack('Guardado en Slot ${slot + 1} ✓');
    } on Object catch (_) {
      if (!mounted) return;
      setState(() => _saving = false);
      _snack('No se pudo guardar');
    }
  }

  /// Diálogo para elegir slot cuando el editor no tiene uno asignado.
  Future<int?> _pickSlot() {
    return showDialog<int>(
      context: context,
      builder: (ctx) => SimpleDialog(
        backgroundColor: AppColors.surface,
        title: const Text(
          'Guardar en…',
          style: TextStyle(color: Colors.white),
        ),
        children: [
          for (var i = 0; i < ProjectStorage.slotCount; i++)
            SimpleDialogOption(
              onPressed: () => Navigator.pop(ctx, i),
              child: Text(
                'Slot ${i + 1}',
                style: const TextStyle(color: Colors.white),
              ),
            ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    graph.removeListener(_onGraphChanged);
    graph.dispose();
    _zoomAnim.dispose();
    zoom.dispose();
    super.dispose();
  }

  /// Anima la matriz del canvas con ease-out (220ms): el cerebro lee
  /// "fluido" aunque el hardware vaya justo. Todo movimiento es real.
  void _animateZoom(Matrix4 target) {
    _zoomAnim
      ..stop()
      ..reset();
    final tween = Matrix4Tween(
      begin: zoom.value.clone(),
      end: target,
    ).chain(CurveTween(curve: Curves.easeOutCubic));
    tween.animate(_zoomAnim).addListener(() {
      zoom.value = tween.evaluate(_zoomAnim);
    });
    unawaited(
      _zoomAnim.forward().whenComplete(() {
        if (mounted) graph.bumpView();
      }),
    );
  }

  /// Encuadra todo el canvas con animación.
  void _fit() => _animateZoom(Matrix4.identity());

  /// Zoom con animación centrado en el viewport (no pierde el pan).
  void _zoomBy(double step) {
    final view = _viewSize;
    final focal = Offset(view.width / 2, view.height / 2);
    final old = zoom.value.clone();
    final oldScale = old.getMaxScaleOnAxis();
    final newScale = (oldScale + step).clamp(0.4, 2.5);
    final k = newScale / oldScale;
    final target = Matrix4.identity()
      ..translateByDouble(focal.dx, focal.dy, 0, 1)
      ..scaleByDouble(k, k, k, 1)
      ..translateByDouble(-focal.dx, -focal.dy, 0, 1)
      ..multiply(old);
    _animateZoom(target);
  }

  // Rect visible en coordenadas de escena, con margen de precarga.
  Rect _visibleRect(Size viewport) {
    final inv = Matrix4.inverted(zoom.value);
    final tl = MatrixUtils.transformPoint(inv, Offset.zero);
    final br = MatrixUtils.transformPoint(
      inv,
      Offset(viewport.width, viewport.height),
    );
    return Rect.fromPoints(tl, br).inflate(260);
  }

  static bool _overlaps(VnNode n, Offset p, Rect vis) {
    final w = n.type == VnNodeType.start ? 110.0 : 190.0;
    return vis.overlaps(Rect.fromLTWH(p.dx, p.dy, w, 220));
  }

  void _showHtml() {
    final html = buildPlayableHtml(graph.project);
    unawaited(
      showDialog<void>(
        context: context,
        builder: (_) => AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text(
            'Web .html generado',
            style: TextStyle(color: Colors.white),
          ),
          content: SizedBox(
            width: 500,
            height: 300,
            child: SingleChildScrollView(
              child: SelectableText(
                html,
                style: const TextStyle(color: Colors.white70, fontSize: 11),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cerrar'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final project = graph.project;
    final slotLabel = _slot == null
        ? 'Sin guardar${_dirty ? ' •' : ''}'
        : 'Slot ${_slot! + 1}${_dirty ? ' • sin guardar' : ' ✓'}';
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        toolbarHeight: 76,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Project: ${project.title}',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            Row(
              children: [
                Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: _slot == null
                        ? Colors.white10
                        : AppColors.cyanSoft,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _slot == null
                          ? AppColors.line
                          : AppColors.cyan,
                    ),
                  ),
                  child: Text(
                    slotLabel,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 10,
                    ),
                  ),
                ),
                FpsChip(
                  visibleOf: () => lastVisible,
                  totalOf: () => project.nodes.length,
                ),
              ],
            ),
          ],
        ),
        actions: [
          _topBtn(
            _saving ? Icons.hourglass_empty : Icons.save_outlined,
            'Save',
            _saving ? () {} : _save,
            active: true,
          ),
          _topBtn(Icons.share, 'Share', _showHtml),
          _topBtn(
            Icons.folder_open,
            'Assets',
            () => Navigator.push(
              context,
              MaterialPageRoute<void>(builder: (_) => const AssetsScreen()),
            ),
          ),
          _topBtn(
            Icons.window,
            '.exe',
            () => _snack('Windows: usa scripts/build.sh --windows'),
          ),
          _topBtn(Icons.html, '.html', _showHtml, active: true),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
              ),
              onPressed: () {
                unawaited(HapticFeedback.selectionClick());
                Navigator.push(
                  context,
                  PageRouteBuilder<void>(
                    transitionDuration: const Duration(milliseconds: 250),
                    transitionsBuilder: (ctx, anim, _, child) {
                      final curved = CurvedAnimation(
                        parent: anim,
                        curve: Curves.easeOutCubic,
                      );
                      return FadeTransition(
                        opacity: curved,
                        child: SlideTransition(
                          position: Tween(
                            begin: const Offset(0.04, 0),
                            end: Offset.zero,
                          ).animate(curved),
                          child: child,
                        ),
                      );
                    },
                    pageBuilder: (_, _, _) => PlayerScreen(project: project),
                  ),
                );
              },
              child: const Text('Play'),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: LayoutBuilder(
              builder: (ctx, cons) {
                _viewSize = cons.biggest;
                return AnimatedBuilder(
                  // El pan/zoom lo mueve la GPU sin reconstruir nada.
                  // El filtro se recalcula al SOLTAR o al cambiar datos.
                  animation: Listenable.merge([
                    graph.edgeVersion,
                    graph.viewVersion,
                  ]),
                  builder: (ctx, _) {
                    final vis = _visibleRect(cons.biggest);
                    final size = graph.canvasSize;
                    // Tile adaptativo: con zoom bajo el canvas visible es
                    // enorme y 512px daría cientos de capas en una HD 5500.
                    final scale = zoom.value.getMaxScaleOnAxis();
                    final tSize = scale >= 0.75
                        ? GridTilePainter.tile
                        : GridTilePainter.tile * 2;
                    final x0 = (vis.left / tSize).floor();
                    final x1 = (vis.right / tSize).floor();
                    final y0 = (vis.top / tSize).floor();
                    final y1 = (vis.bottom / tSize).floor();
                    final edgeVersion = graph.edgeVersion.value;
                    final visibles = <VnNode>[];
                    for (final n in project.nodes) {
                      final p = graph.posOf[n.id]?.value ?? Offset(n.x, n.y);
                      if (_overlaps(n, p, vis)) visibles.add(n);
                    }
                    lastVisible = visibles.length;
                    return InteractiveViewer(
                      transformationController: zoom,
                      constrained: false,
                      boundaryMargin: const EdgeInsets.all(400),
                      minScale: 0.4,
                      // Al soltar el pan/zoom se recalcula el culling.
                      onInteractionEnd: (_) => graph.bumpView(),
                      // Importante: el hijo NO se reconstruye al
                      // hacer pan/zoom, Flutter solo aplica la matriz.
                      child: SizedBox.fromSize(
                        size: size,
                        child: Stack(
                          children: [
                            // Grid por tiles: solo existen los visibles.
                            // El pan los mueve la GPU sin repintar.
                            for (var gx = x0; gx <= x1; gx++)
                              for (var gy = y0; gy <= y1; gy++)
                                Positioned(
                                  left: gx * tSize,
                                  top: gy * tSize,
                                  child: RepaintBoundary(
                                    child: CustomPaint(
                                      size: Size(tSize, tSize),
                                      painter: GridTilePainter(
                                        tx: gx,
                                        ty: gy,
                                        size: tSize,
                                      ),
                                    ),
                                  ),
                                ),
                            // Aristas por tiles: adiós a la textura gigante
                            // del canvas completo que ahogaba a la iGPU.
                            for (var ex = x0; ex <= x1; ex++)
                              for (var ey = y0; ey <= y1; ey++)
                                Positioned(
                                  left: ex * tSize,
                                  top: ey * tSize,
                                  child: RepaintBoundary(
                                    child: CustomPaint(
                                      size: Size(tSize, tSize),
                                      isComplex: true,
                                      painter: EdgeTilePainter(
                                        project: project,
                                        version: edgeVersion,
                                        tx: ex,
                                        ty: ey,
                                        size: tSize,
                                      ),
                                    ),
                                  ),
                                ),
                            for (final n in visibles)
                              ValueListenableBuilder<Offset>(
                                valueListenable: graph.posOf[n.id]!,
                                builder: (ctx, p, child) => Positioned(
                                  left: p.dx,
                                  top: p.dy,
                                  child: RepaintBoundary(
                                    child: DraggableNode(
                                      key: ValueKey(n.id),
                                      node: n,
                                      onMove: (dx, dy) =>
                                          graph.previewMove(n, dx, dy),
                                      onDragEnd: () {
                                        unawaited(HapticFeedback.lightImpact());
                                        graph.commitMove();
                                      },
                                      onDelete: () {
                                        unawaited(
                                          HapticFeedback.mediumImpact(),
                                        );
                                        graph.deleteNode(n);
                                      },
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.line)),
            ),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _zoomBtn(Icons.add, () => _zoomBy(0.1)),
                  _zoomBtn(Icons.remove, () => _zoomBy(-0.1)),
                  TextButton(
                    onPressed: _fit,
                    child: const Text(
                      'Fit',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                  const SizedBox(width: 12),
                  _addBtn('+ Dialogue', VnNodeType.dialogue, AppColors.cyan),
                  _addBtn('+ Sprite', VnNodeType.sprite, AppColors.cyan),
                  _addBtn('+ Choice', VnNodeType.choice, AppColors.danger),
                  _addBtn('+ Sound', VnNodeType.sound, AppColors.danger),
                  _actionBtn('⚡500', () {
                    graph.stress500();
                    _fit();
                  }),
                  _actionBtn('Demo', () {
                    graph.restoreDemo();
                    _fit();
                  }),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _topBtn(
    IconData i,
    String label,
    VoidCallback fn, {
    bool active = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(top: 2),
      child: SizedBox(
        height: 68,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              iconSize: 20,
              constraints: const BoxConstraints(minHeight: 32, minWidth: 32),
              padding: EdgeInsets.zero,
              onPressed: fn,
              icon: Icon(i, color: active ? AppColors.cyan : Colors.white70),
              style: IconButton.styleFrom(
                backgroundColor: active ? AppColors.cyanSoft : null,
                side: active ? const BorderSide(color: AppColors.cyan) : null,
              ),
            ),
            Text(
              label,
              style: const TextStyle(color: Colors.white54, fontSize: 9),
            ),
          ],
        ),
      ),
    );
  }

  Widget _zoomBtn(IconData i, VoidCallback fn) {
    return IconButton(
      onPressed: fn,
      icon: Icon(i, color: Colors.white),
    );
  }

  Widget _addBtn(String label, VnNodeType t, Color c) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: OutlinedButton(
        onPressed: () {
          unawaited(HapticFeedback.selectionClick());
          graph.addNode(t);
        },
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          side: BorderSide(color: c),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        child: Text(label),
      ),
    );
  }

  Widget _actionBtn(String label, VoidCallback fn) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: OutlinedButton(
        onPressed: fn,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.warn,
          side: const BorderSide(color: AppColors.warn),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        child: Text(label),
      ),
    );
  }

  void _snack(String m) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
}
