#include "mainwindow.h"
#include "canvasview.h"
#include "graph.h"
#include "nodeitem.h"
#include "wireitem.h"
#include <QGraphicsScene>
#include <QMap>
#include <QPushButton>
#include <QToolBar>

MainWindow::MainWindow(QWidget *parent) : QMainWindow(parent) {
    setWindowTitle(QStringLiteral("My Novel — Visual Novel Node Studio (Qt/C++)"));
    resize(1280, 800);
    setStyleSheet(
        "QMainWindow { background: #0d1124; }"
        "QToolBar { background: #121629; border: none; spacing: 10px; padding: 6px; }"
        "QLabel { color: #f1f5f9; }"
        "QPushButton { background: #232b4a; color: white; border: 1px solid #00f2fe66;"
        " border-radius: 12px; padding: 6px 14px; }"
        "QPushButton:hover { background: #2d3860; }");

    auto *bar = addToolBar(QStringLiteral("Studio"));
    bar->setMovable(false);
    auto *title = new QLabel(QStringLiteral("Project:  <b>My Novel</b>"));
    bar->addWidget(title);
    bar->addSeparator();
    auto *zoomOut = new QPushButton(QStringLiteral("−"));
    auto *zoomIn = new QPushButton(QStringLiteral("+"));
    m_zoomLabel = new QLabel(QStringLiteral("92%"));
    m_zoomLabel->setMinimumWidth(48);
    m_zoomLabel->setAlignment(Qt::AlignCenter);
    bar->addWidget(zoomOut);
    bar->addWidget(m_zoomLabel);
    bar->addWidget(zoomIn);

    auto *scene = new QGraphicsScene(this);
    m_canvas = new CanvasView(this);
    m_canvas->setScene(scene);
    setCentralWidget(m_canvas);

    connect(zoomOut, &QPushButton::clicked, m_canvas, &CanvasView::zoomOut);
    connect(zoomIn, &QPushButton::clicked, m_canvas, &CanvasView::zoomIn);
    connect(m_canvas, &CanvasView::zoomChanged, this, &MainWindow::updateZoomLabel);

    // Slice 1: Sora preset.
    const graph::State state = graph::loadSoraPreset();
    QMap<QString, NodeItem *> items;
    for (const auto &n : state.nodes) {
        auto *item = new NodeItem(n);
        scene->addItem(item);
        items.insert(n.id, item);
    }
    QVector<WireItem *> wires;
    for (const auto &wr : state.wires) {
        NodeItem *a = items.value(wr.fromNode, nullptr);
        NodeItem *b = items.value(wr.toNode, nullptr);
        if (!a || !b) continue;
        auto *w = new WireItem(a->portScenePos(wr.fromPort), b->portScenePos(wr.toPort), wr.color);
        scene->addItem(w);
        wires.append(w);
        auto refresh = [=]() {
            w->setEnds(a->portScenePos(wr.fromPort), b->portScenePos(wr.toPort));
        };
        connect(a, &NodeItem::moved, this, refresh);
        connect(b, &NodeItem::moved, this, refresh);
    }
    m_canvas->resetView();
}

void MainWindow::updateZoomLabel(double z) {
    m_zoomLabel->setText(QStringLiteral("%1%").arg(qRound(z * 100)));
}
