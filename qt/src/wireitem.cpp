#include "wireitem.h"
#include "graph.h"
#include <QPainter>
#include <QStyleOptionGraphicsItem>

namespace {
QColor wireColor(const QString &c) {
    return c == "coral" ? QColor(0xff, 0x75, 0x6b) : QColor(0x00, 0xf2, 0xfe);
}
}

WireItem::WireItem(const QPointF &from, const QPointF &to, const QString &color,
                   QGraphicsItem *parent)
    : QGraphicsPathItem(parent), m_color(color) {
    setZValue(-1);
    QPen core(wireColor(color));
    core.setWidthF(3.5);
    core.setCapStyle(Qt::RoundCap);
    setPen(core);
    setEnds(from, to);
}

void WireItem::setEnds(const QPointF &from, const QPointF &to) {
    QPainterPath path(from);
    const double dx = graph::bezierDx(from.x(), to.x());
    path.cubicTo(from.x() + dx, from.y(), to.x() - dx, to.y(), to.x(), to.y());
    setPath(path);
}

void WireItem::paint(QPainter *p, const QStyleOptionGraphicsItem *o, QWidget *w) {
    // Glow pass: wide translucent stroke under the bright core.
    p->setRenderHint(QPainter::Antialiasing);
    QPen glow(wireColor(m_color));
    glow.setWidthF(10);
    glow.setCapStyle(Qt::RoundCap);
    QColor t = wireColor(m_color);
    t.setAlpha(60);
    glow.setColor(t);
    p->setPen(glow);
    p->drawPath(path());
    QGraphicsPathItem::paint(p, o, w);
}
