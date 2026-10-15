// Apartado "Assets": administrador de assets del usuario.
// Por ahora solo librería (alta, etiquetas, búsqueda, exportar JSON).
// La colocación en nodos llegará después referenciando el id del asset.
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:me_proyecto/core/theme/app_theme.dart';
import 'package:me_proyecto/features/assets/models/asset_models.dart';
import 'package:me_proyecto/features/assets/state/asset_controller.dart';

/// Pantalla del administrador de assets.
class AssetsScreen extends StatefulWidget {
  /// Crea el apartado con su propio controlador o uno externo.
  const new({this.controller, super.key});

  /// Controlador externo (tests o shell compartido). Si es null se crea uno.
  final AssetController? controller;

  @override
  State<AssetsScreen> createState() => _AssetsScreenState();
}

class _AssetsScreenState extends State<AssetsScreen> {
  late final AssetController assets;
  late final bool _ownsController;
  final TextEditingController _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    _ownsController = widget.controller == null;
    assets = widget.controller ?? AssetController.demo();
    assets.addListener(_onChanged);
  }

  void _onChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    assets.removeListener(_onChanged);
    if (_ownsController) assets.dispose();
    _search.dispose();
    super.dispose();
  }

  void _snack(String m) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  Future<void> _showAdd() async {
    final result = await showDialog<_AssetDraft>(
      context: context,
      builder: (_) => const _AssetDialog(),
    );
    if (result == null) return;
    final created = assets.addAsset(
      result.name,
      result.tags,
      note: result.note,
    );
    _snack(
      created == null ? 'Nombre vacío, nada que guardar' : 'Asset guardado',
    );
  }

  Future<void> _showEdit(UserAsset a) async {
    final result = await showDialog<_AssetDraft>(
      context: context,
      builder: (_) => _AssetDialog(initial: a),
    );
    if (result == null) return;
    assets.rename(a.id, result.name);
    assets.setTags(a.id, result.tags);
    assets.setNote(a.id, result.note);
    _snack('Asset actualizado');
  }

  void _confirmDelete(UserAsset a) {
    unawaited(
      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text('Borrar asset', style: TextStyle(color: Colors.white)),
          content: Text(
            '¿Borrar "${a.name}"? Los nodos lo usarán más adelante, '
            'por ahora solo sale de la librería.',
            style: const TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancelar'),
            ),
            TextButton(
              onPressed: () {
                assets.remove(a.id);
                Navigator.pop(ctx);
                _snack('Asset borrado');
              },
              child: const Text('Borrar', style: TextStyle(color: AppColors.danger)),
            ),
          ],
        ),
      ),
    );
  }

  void _showExport() {
    final json = assets.exportJson();
    unawaited(
      showDialog<void>(
        context: context,
        builder: (_) => AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text('Assets exportados', style: TextStyle(color: Colors.white)),
          content: SizedBox(
            width: 500,
            height: 300,
            child: SingleChildScrollView(
              child: SelectableText(
                json,
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
    final list = assets.visible;
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text('Assets (${assets.all.length})'),
        actions: [
          IconButton(
            tooltip: 'Exportar',
            icon: const Icon(Icons.share),
            onPressed: assets.all.isEmpty
                ? () => _snack('Nada que exportar todavía')
                : _showExport,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        tooltip: 'Añadir asset',
        onPressed: _showAdd,
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
            child: TextField(
              controller: _search,
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Buscar por nombre...',
                border: OutlineInputBorder(),
              ),
              onChanged: assets.setQuery,
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                _FilterChip(
                  label: 'todos',
                  selected: assets.filter == null,
                  onTap: () => assets.setFilter(null),
                ),
                for (final t in AssetTag.values)
                  _FilterChip(
                    label: t.label,
                    selected: assets.filter == t,
                    onTap: () => assets.setFilter(
                      assets.filter == t ? null : t,
                    ),
                  ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              'Los assets se usarán en los nodos más adelante. '
              'Por ahora se gestionan aquí con etiquetas.',
              style: TextStyle(color: Colors.white54, fontSize: 12),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: list.isEmpty
                ? const Center(
                    child: Text(
                      'Sin assets: pulsa + para añadir el primero',
                      style: TextStyle(color: Colors.white54),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 4, 12, 80),
                    itemCount: list.length,
                    itemBuilder: (_, i) => _AssetCard(
                      asset: list[i],
                      onEdit: () => _showEdit(list[i]),
                      onDelete: () => _confirmDelete(list[i]),
                      onUseInNode: () => _snack(
                        'Pronto: "${list[i].name}" se podrá poner en nodos',
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

/// Borrador del diálogo de alta/edición.
class _AssetDraft {
  const _AssetDraft({
    required this.name,
    required this.tags,
    required this.note,
  });
  final String name;
  final Set<AssetTag> tags;
  final String note;
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
      ),
    );
  }
}

class _AssetCard extends StatelessWidget {
  const _AssetCard({
    required this.asset,
    required this.onEdit,
    required this.onDelete,
    required this.onUseInNode,
  });

  final UserAsset asset;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onUseInNode;

  @override
  Widget build(BuildContext context) {
    final initial = asset.name.isEmpty ? '?' : asset.name[0].toUpperCase();
    return Card(
      color: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.line),
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppColors.cyanChip,
          child: Text(initial, style: const TextStyle(color: Colors.white)),
        ),
        title: Text(asset.name, style: const TextStyle(color: Colors.white)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Wrap(
              spacing: 6,
              children: [
                if (asset.tags.isEmpty)
                  const Text(
                    'sin etiqueta',
                    style: TextStyle(color: Colors.white54, fontSize: 12),
                  )
                else
                  for (final t in asset.tags)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.cyanSoft,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.cyan),
                      ),
                      child: Text(t.label, style: const TextStyle(fontSize: 11)),
                    ),
              ],
            ),
            if (asset.note.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  asset.note,
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              tooltip: 'Poner en nodo (pronto)',
              icon: const Icon(
                Icons.account_tree_outlined,
                color: AppColors.cyan,
              ),
              onPressed: onUseInNode,
            ),
            IconButton(
              tooltip: 'Editar',
              icon: const Icon(Icons.edit, color: Colors.white70),
              onPressed: onEdit,
            ),
            IconButton(
              tooltip: 'Borrar',
              icon: const Icon(Icons.delete, color: AppColors.danger),
              onPressed: onDelete,
            ),
          ],
        ),
      ),
    );
  }
}

class _AssetDialog extends StatefulWidget {
  const _AssetDialog({this.initial});
  final UserAsset? initial;

  @override
  State<_AssetDialog> createState() => _AssetDialogState();
}

class _AssetDialogState extends State<_AssetDialog> {
  late final TextEditingController _name;
  late final TextEditingController _note;
  late Set<AssetTag> _tags;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.initial?.name ?? '');
    _note = TextEditingController(text: widget.initial?.note ?? '');
    _tags = Set.of(widget.initial?.tags ?? {});
  }

  @override
  void dispose() {
    _name.dispose();
    _note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final editing = widget.initial != null;
    return AlertDialog(
      backgroundColor: AppColors.surface,
      title: Text(
        editing ? 'Editar asset' : 'Nuevo asset',
        style: const TextStyle(color: Colors.white),
      ),
      content: SizedBox(
        width: 420,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: _name,
                decoration: const InputDecoration(labelText: 'Nombre'),
                autofocus: true,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _note,
                decoration: const InputDecoration(labelText: 'Nota (opcional)'),
              ),
              const SizedBox(height: 12),
              const Text('Etiquetas', style: TextStyle(color: Colors.white70)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                children: [
                  for (final t in AssetTag.values)
                    FilterChip(
                      label: Text(t.label),
                      selected: _tags.contains(t),
                      onSelected: (sel) => setState(() {
                        if (sel) {
                          _tags.add(t);
                        } else {
                          _tags.remove(t);
                        }
                      }),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(
            context,
            _AssetDraft(name: _name.text, tags: _tags, note: _note.text),
          ),
          child: Text(editing ? 'Guardar' : 'Añadir'),
        ),
      ],
    );
  }
}
