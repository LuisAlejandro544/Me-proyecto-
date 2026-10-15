#pragma once
// Main window: dark studio chrome + canvas. Slice 1: top bar + canvas + zoom.
#include <QLabel>
#include <QMainWindow>

class CanvasView;

class MainWindow : public QMainWindow {
    Q_OBJECT
public:
    explicit MainWindow(QWidget *parent = nullptr);
    CanvasView *canvas() const { return m_canvas; }

private slots:
    void updateZoomLabel(double z);

private:
    CanvasView *m_canvas = nullptr;
    QLabel *m_zoomLabel = nullptr;
};
