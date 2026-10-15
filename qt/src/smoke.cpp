// Offscreen smoke test: builds the Sora scene and renders PNGs.
// Run: QT_QPA_PLATFORM=offscreen ./smoke   (writes smoke-92.png, smoke-200.png)
#include "canvasview.h"
#include "graph.h"
#include "nodeitem.h"
#include "wireitem.h"
#include <QApplication>
#include <QGraphicsScene>
#include <QImage>
#include <QPainter>
#include <QMap>
#include <cstdio>

static void render(CanvasView &view, QGraphicsScene &scene, double zoom, const char *file) {
    view.setZoom(0.92);
    // reset internal scale bookkeeping, then apply target zoom at center.
    view.resetView();
    view.setZoom(zoom);
    QImage img(1280, 800, QImage::Format_ARGB32);
    img.fill(QColor(0x0d, 0x11, 0x24));
    QPainter p(&img);
    view.render(&p);
    p.end();
    if (!img.save(QString::fromUtf8(file)))
        std::printf("FAIL save %s\n", file);
    else
        std::printf("OK %s (nodes=%d)\n", file, scene.items().size());
}

int main(int argc, char **argv) {
    QApplication app(argc, argv);
    QGraphicsScene scene;
    CanvasView view;
    view.setScene(&scene);
    view.resize(1280, 800);

    const graph::State state = graph::loadSoraPreset();
    QMap<QString, NodeItem *> items;
    for (const auto &n : state.nodes) {
        auto *item = new NodeItem(n);
        scene.addItem(item);
        items.insert(n.id, item);
    }
    for (const auto &wr : state.wires) {
        NodeItem *a = items.value(wr.fromNode, nullptr);
        NodeItem *b = items.value(wr.toNode, nullptr);
        if (!a || !b) continue;
        scene.addItem(new WireItem(a->portScenePos(wr.fromPort), b->portScenePos(wr.toPort), wr.color));
    }
    render(view, scene, 0.92, "smoke-92.png");
    render(view, scene, 2.0, "smoke-200.png");
    return 0;
}
