#include "canvasview.h"
#include <QMouseEvent>
#include <QPainter>
#include <QScrollBar>
#include <QWheelEvent>

namespace {
constexpr double kMinZoom = 0.35;
constexpr double kMaxZoom = 2.0;
constexpr double kHomeZoom = 0.92;
}

CanvasView::CanvasView(QWidget *parent) : QGraphicsView(parent) {
    setRenderHint(QPainter::Antialiasing);
    setViewportUpdateMode(FullViewportUpdate);
    setTransformationAnchor(AnchorUnderMouse);
    setResizeAnchor(AnchorViewCenter);
    setBackgroundBrush(QColor(0x0e, 0x13, 0x26));
    setFrameShape(QFrame::NoFrame);
    scale(m_zoom, m_zoom);
}

void CanvasView::applyZoom(double z, const QPoint &anchor) {
    z = qBound(kMinZoom, z, kMaxZoom);
    if (qFuzzyCompare(z, m_zoom)) return;
    // AnchorUnderMouse keeps the scene point under the cursor stable.
    centerOn(mapToScene(anchor));
    const double f = z / m_zoom;
    scale(f, f);
    m_zoom = z;
    emit zoomChanged(m_zoom);
}

void CanvasView::setZoom(double z) {
    applyZoom(z, mapFromGlobal(QCursor::pos()));
}

void CanvasView::zoomIn() { setZoom(m_zoom + 0.1); }
void CanvasView::zoomOut() { setZoom(m_zoom - 0.1); }

void CanvasView::resetView() {
    resetTransform();
    m_zoom = 1.0;
    scale(kHomeZoom, kHomeZoom);
    m_zoom = kHomeZoom;
    centerOn(400, 200);
    emit zoomChanged(m_zoom);
}

void CanvasView::wheelEvent(QWheelEvent *e) {
    const double step = (e->angleDelta().y() > 0) ? 0.07 : -0.07;
    applyZoom(m_zoom + step, e->position().toPoint());
    e->accept();
}

void CanvasView::mousePressEvent(QMouseEvent *e) {
    // Empty canvas + left button: start pan. Nodes/ports handle their own drag.
    if (e->button() == Qt::LeftButton &&
        !scene()->itemAt(mapToScene(e->pos()), QTransform())) {
        m_panning = true;
        m_lastPos = e->pos();
        setCursor(Qt::ClosedHandCursor);
        e->accept();
        return;
    }
    QGraphicsView::mousePressEvent(e);
}

void CanvasView::mouseMoveEvent(QMouseEvent *e) {
    if (m_panning) {
        const QPoint d = e->pos() - m_lastPos;
        m_lastPos = e->pos();
        horizontalScrollBar()->setValue(horizontalScrollBar()->value() - d.x());
        verticalScrollBar()->setValue(verticalScrollBar()->value() - d.y());
        e->accept();
        return;
    }
    QGraphicsView::mouseMoveEvent(e);
}

void CanvasView::mouseReleaseEvent(QMouseEvent *e) {
    if (m_panning && e->button() == Qt::LeftButton) {
        m_panning = false;
        unsetCursor();
        e->accept();
        return;
    }
    QGraphicsView::mouseReleaseEvent(e);
}

void CanvasView::drawBackground(QPainter *p, const QRectF &rect) {
    QGraphicsView::drawBackground(p, rect);
    // Dot grid every 24px + faint lines every 48px (mirrors the web canvas).
    p->setPen(Qt::NoPen);
    p->setBrush(QColor(148, 163, 218, 56));
    const double step = 24.0;
    const int x0 = int(rect.left() / step), x1 = int(rect.right() / step);
    const int y0 = int(rect.top() / step), y1 = int(rect.bottom() / step);
    for (int gx = x0; gx <= x1; ++gx)
        for (int gy = y0; gy <= y1; ++gy)
            p->drawEllipse(QPointF(gx * step, gy * step), 1.4, 1.4);
}
