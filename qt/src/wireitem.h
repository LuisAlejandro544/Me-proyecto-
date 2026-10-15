#pragma once
// Glowing cubic wire between two ports. Mirrors buildBezierPath()
// in src/lib/studio/domain/geometry.ts.
#include <QGraphicsPathItem>

class WireItem : public QGraphicsPathItem {
public:
    WireItem(const QPointF &from, const QPointF &to, const QString &color,
             QGraphicsItem *parent = nullptr);
    void setEnds(const QPointF &from, const QPointF &to);

protected:
    void paint(QPainter *p, const QStyleOptionGraphicsItem *o, QWidget *w) override;

private:
    QString m_color;
};
