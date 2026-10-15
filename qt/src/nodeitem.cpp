#include "nodeitem.h"
#include <QPainter>
#include <QStyleOptionGraphicsItem>

namespace {
const QColor kCyan(0x00, 0xf2, 0xfe);
const QColor kCoral(0xff, 0x75, 0x6b);
QColor portColor(const QString &c) { return c == "coral" ? kCoral : kCyan; }
}

NodeItem::NodeItem(const graph::Node &node, QGraphicsItem *parent)
    : QGraphicsObject(parent), m_node(node) {
    setFlags(ItemIsMovable | ItemIsSelectable | ItemSendsGeometryChanges);
    setPos(node.x, node.y);
    m_bounds = QRectF(0, 0, node.width, cardHeight());
}

double NodeItem::cardHeight() const {
    if (m_node.type == "banner_scene") return 300;
    if (m_node.type == "choice") return 150;
    if (m_node.type == "compact_scene") return 140;
    if (m_node.type == "character_selector") return 260;
    return 160;
}

QVariant NodeItem::itemChange(GraphicsItemChange change, const QVariant &value) {
    if (change == ItemPositionHasChanged) {
        m_node.x = pos().x();
        m_node.y = pos().y();
        emit moved();
    }
    return QGraphicsObject::itemChange(change, value);
}

QPointF NodeItem::portScenePos(const QString &portId) const {
    // Output ports of banner nodes sit on the right edge at their yOffset.
    for (const auto &p : m_node.portsOut) {
        if (p.id == portId)
            return mapToScene(m_bounds.width(), p.yOffset);
    }
    // Choice options: out on the right edge, in on the left edge.
    for (int i = 0; i < m_node.options.size(); ++i) {
        const double y = 62 + i * 44;
        if (portId == "out_" + m_node.options[i].id)
            return mapToScene(m_bounds.width(), y);
        if (portId == "in_" + m_node.options[i].id)
            return mapToScene(0, y);
    }
    // Compact scenes: single input on the left edge.
    if (portId == "in_main")
        return mapToScene(0, 70);
    return mapToScene(m_bounds.width() / 2, m_bounds.height() / 2);
}

void NodeItem::paint(QPainter *p, const QStyleOptionGraphicsItem *, QWidget *) {
    p->setRenderHint(QPainter::Antialiasing);
    const double w = m_bounds.width(), h = m_bounds.height();

    // Card.
    QLinearGradient bg(0, 0, 0, h);
    bg.setColorAt(0, QColor(0x23, 0x2a, 0x48, 240));
    bg.setColorAt(1, QColor(0x16, 0x1b, 0x30, 245));
    p->setBrush(bg);
    p->setPen(QPen(QColor(118, 138, 198, 90), 1.5));
    p->drawRoundedRect(m_bounds, 16, 16);

    const bool isChoice = m_node.type == "choice";
    double y = 14;

    auto drawBadge = [&](const QString &text) {
        QFont f = p->font(); f.setPointSize(9); f.setBold(true); p->setFont(f);
        QFontMetrics fm(f);
        const double bw = fm.horizontalAdvance(text) + 20;
        p->setBrush(QColor(0x4f, 0x46, 0xe5));
        p->setPen(Qt::NoPen);
        p->drawRoundedRect(QRectF(14, y, bw, 22), 6, 6);
        p->setPen(Qt::white);
        p->drawText(QRectF(14, y, bw, 22), Qt::AlignCenter, text);
        y += 30;
    };

    QFont titleF = p->font(); titleF.setBold(true);
    if (m_node.type == "banner_scene") {
        drawBadge(m_node.badge);
        // Speaker color bar instead of the photo (slice 1: no binary assets).
        p->setBrush(QColor(m_node.speakerColor));
        p->setPen(Qt::NoPen);
        p->drawRoundedRect(QRectF(14, y, w - 28, 110), 10, 10);
        p->setPen(QColor(m_node.speakerColor));
        QFont sf = p->font(); sf.setBold(true); sf.setPointSize(11); p->setFont(sf);
        p->drawText(QRectF(14, y + 118, w - 28, 20), Qt::AlignLeft, m_node.speaker);
        p->setPen(Qt::white);
        QFont df = p->font(); df.setPointSize(11); p->setFont(df);
        p->drawText(QRectF(14, y + 140, w - 28, 60), Qt::AlignLeft | Qt::TextWordWrap, m_node.dialogue);
    } else if (isChoice) {
        titleF.setPointSize(11); p->setFont(titleF);
        p->setPen(Qt::white);
        p->drawText(QRectF(14, y, w - 60, 22), Qt::AlignLeft,
                    m_node.title + " " + m_node.subtitle);
        y += 34;
        QFont of = p->font(); of.setPointSize(10); p->setFont(of);
        for (int i = 0; i < m_node.options.size(); ++i) {
            const double oy = y + i * 44;
            p->setBrush(QColor(0x1e, 0x29, 0x4b, 200));
            p->setPen(QColor(120, 145, 215, 60));
            p->drawRoundedRect(QRectF(30, oy, w - 60, 34), 8, 8);
            p->setPen(Qt::white);
            p->drawText(QRectF(40, oy, w - 80, 34), Qt::AlignVCenter | Qt::AlignLeft,
                        m_node.options[i].label);
            // in-port (left) + out-port (right).
            for (int side = 0; side < 2; ++side) {
                const bool in = side == 0;
                const QString pc = in ? m_node.options[i].inColor : m_node.options[i].outColor;
                p->setBrush(portColor(pc));
                p->setPen(QPen(QColor(0x0f, 0x17, 0x2a), 2.5));
                p->drawEllipse(QPointF(in ? 8 : w - 8, oy + 17), 7, 7);
            }
        }
    } else if (m_node.type == "compact_scene") {
        titleF.setPointSize(11); p->setFont(titleF);
        p->setPen(Qt::white);
        p->drawText(QRectF(14, y, w - 28, 22), Qt::AlignLeft, m_node.title);
        QFont df = p->font(); df.setPointSize(10); p->setFont(df);
        p->setPen(QColor(0xe2, 0xe8, 0xf0));
        p->drawText(QRectF(14, y + 26, w - 28, 50), Qt::AlignLeft | Qt::TextWordWrap, m_node.dialogue);
    } else { // character_selector
        titleF.setPointSize(11); p->setFont(titleF);
        p->setPen(Qt::white);
        p->drawText(QRectF(0, y, w, 22), Qt::AlignCenter, m_node.title);
        QFont ef = p->font(); ef.setPointSize(10); p->setFont(ef);
        p->setPen(QColor(0xe2, 0xe8, 0xf0));
        p->drawText(QRectF(0, y + 30, w, 22), Qt::AlignCenter, m_node.expression);
        QFont mf = p->font(); mf.setPointSize(9); p->setFont(mf);
        p->setPen(QColor(0x94, 0xa3, 0xb8));
        p->drawText(QRectF(14, y + 60, w - 28, 20), Qt::AlignLeft,
                    QString("Scale  %1%").arg(m_node.scale));
        p->drawText(QRectF(14, y + 84, w - 28, 20), Qt::AlignLeft,
                    QString("Position  %1%").arg(m_node.position));
    }

    // Output ports on the right edge (banner nodes).
    for (const auto &po : m_node.portsOut) {
        p->setBrush(portColor(po.color));
        p->setPen(QPen(QColor(0x0f, 0x17, 0x2a), 2.5));
        p->drawEllipse(QPointF(w, po.yOffset), 7, 7);
    }
    // Single input on the left edge (compact scenes / selector).
    if (m_node.type == "compact_scene" || m_node.type == "character_selector") {
        p->setBrush(kCyan);
        p->setPen(QPen(QColor(0x0f, 0x17, 0x2a), 2.5));
        p->drawEllipse(QPointF(0, 70), 7, 7);
    }
}
