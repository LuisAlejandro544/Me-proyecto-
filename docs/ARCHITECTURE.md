# Arquitectura

Estructura por capas y features (escala a equipo grande sin reescrituras):

```
lib/
  main.dart                # bootstrap mínimo (ideal para integration_test)
  app/app.dart             # MaterialApp + tema + home
  core/
    theme/app_theme.dart   # AppColors + ThemeData (cero hex en UI)
    perf/fps_chip.dart      # medidor de fps autocontenido
  features/graph/
    graph.dart             # barrel: un import por feature
    models/vn_models.dart  # datos puros, sin Flutter (testeable)
    state/graph_controller.dart # ChangeNotifier: índice O(1), canvas cacheado
    editor/editor_screen.dart   # UI fina: culling + InteractiveViewer
    editor/node_widgets.dart    # tarjetas con estado de arrastre local
    editor/painters.dart        # GridPainter + EdgePainter versionado
    player/player_screen.dart   # preview jugable
    export/html_exporter.dart   # HTML autocontenido (CSS propio, no tokens)
```

## Presupuesto de rendimiento (tostadora: 60fps con 500 nodos)

1. **Culling por viewport**: solo se construyen los nodos visibles. El pan/zoom
   lo compone la GPU; el filtro se recalcula solo al soltar (`onInteractionEnd`).
2. **Estado local de arrastre**: mover 1 nodo repinta solo ese nodo; las
   aristas se repintan 1 vez por gesto (`EdgePainter.version`).
3. **Índice O(1)** de nodos en pintado y controlador (nada de `byId` en loops).
4. **Cero sombras y cero opacidades** en el canvas (evitan `saveLayer`, lo más
   caro en GPUs integradas). Colores sólidos + `RepaintBoundary` por capa.
5. **Sin dependencias externas**: el APK no carga ni inicializa nada de terceros;
   arranca más rápido y compila offline.
6. Archivos <500 líneas, `flutter analyze` limpio, tests unitarios + widget.
   Estándar: `very_good_analysis`, `package:` imports, modelos inmutables
   con `copyWith` + igualdad por valor, docs en toda API pública,
   `dart format` verificado en CI y `flutter_lints` solo como referencia.
7. **Loteo de aristas** (`painters.dart`): 2 `drawPath` + 2 `drawRawPoints`
   en vez de 500+500 llamadas. Micro-bench: 5.14 → 1.60 ms (−69%).
8. **Grid por tiles** de 512px alineados al grid global: solo existen los
   visibles, memoria constante (el canvas gigante rozaba el límite de
   textura GPU). 12 tiles: 0.59 ms total.
