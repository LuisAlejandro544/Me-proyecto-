#pragma once
// Pan/zoom canvas. Vector rendering: crisp at any zoom by design
// (fixes the CSS-scale blur — see docs/DECISIONS.md ADR-006).
#include <QGraphicsView>

class CanvasView : public QGraphicsView {
    Q_OBJECT
public:
    explicit CanvasView(QWidget *parent = nullptr);
    double zoom() const { return m_zoom; }

public slots:
    void setZoom(double z);
    void zoomIn();
    void zoomOut();
    void resetView();

signals:
    void zoomChanged(double z);

protected:
    void wheelEvent(QWheelEvent *e) override;
    void mousePressEvent(QMouseEvent *e) override;
    void mouseMoveEvent(QMouseEvent *e) override;
    void mouseReleaseEvent(QMouseEvent *e) override;
    void drawBackground(QPainter *p, const QRectF &rect) override;

private:
    void applyZoom(double z, const QPoint &anchor);
    double m_zoom = 0.92;
    bool m_panning = false;
    QPoint m_lastPos;
};
