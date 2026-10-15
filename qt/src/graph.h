#pragma once
// Graph data model. Mirrors src/lib/types.ts (VNNode/VNWire/VNState)
// and the Sora preset in src/lib/studio/data/presets.ts.
#include <QString>
#include <QVector>

namespace graph {

struct PortOut {
    QString id;
    QString color; // "cyan" | "coral"
    double yOffset = 0;
};

struct ChoiceOption {
    QString id;
    QString label;
    QString inColor;
    QString outColor;
};

struct Node {
    QString id;
    QString type; // banner_scene | choice | compact_scene | character_selector
    double x = 0, y = 0, width = 240;
    QString badge;
    QString title;
    QString subtitle;
    QString speaker;
    QString speakerColor;
    QString dialogue;
    QString characterId;
    QString selectedCharId;
    QString expression;
    int scale = 100;
    int position = 50;
    QVector<PortOut> portsOut;
    QVector<ChoiceOption> options;
};

struct Wire {
    QString id;
    QString fromNode, fromPort, toNode, toPort;
    QString color;
};

struct State {
    QString projectName;
    double zoom = 0.92;
    double panX = 20, panY = 15;
    QVector<Node> nodes;
    QVector<Wire> wires;
};

State loadSoraPreset();
double bezierDx(double x1, double x2);

} // namespace graph
