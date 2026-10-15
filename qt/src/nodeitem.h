#pragma once
// Node card rendered with QPainter (vectors: crisp at any zoom by design).
#include <QGraphicsObject>
#include "graph.h"

class NodeItem : public QGraphicsObject {
    Q_OBJECT
public:
    explicit NodeItem(const graph::Node &node, QGraphicsItem *parent = nullptr);

    QRectF boundingRect() const override { return m_bounds; }
    void paint(QPainter *p, const QStyleOptionGraphicsItem *, QWidget *) override;

    QString nodeId() const { return m_node.id; }
    graph::Node &data() { return m_node; }
    // Scene position of a port (for wires). Unknown ports fall back to edges.
    QPointF portScenePos(const QString &portId) const;

signals:
    void moved();

protected:
    QVariant itemChange(GraphicsItemChange change, const QVariant &value) override;

private:
    graph::Node m_node;
    QRectF m_bounds;
    double cardHeight() const;
};
