#include "graph.h"
#include <QtMath>

namespace graph {

double bezierDx(double x1, double x2) {
    return qMax(qAbs(x2 - x1) * 0.55, 60.0);
}

State loadSoraPreset() {
    State s;
    s.projectName = QStringLiteral("My Novel");
    s.zoom = 0.92;
    s.panX = 20;
    s.panY = 15;

    Node start;
    start.id = "start_scene_1";
    start.type = "banner_scene";
    start.badge = "Start Scene 1";
    start.x = 65; start.y = 85; start.width = 245;
    start.characterId = "sora";
    start.speaker = "Sora";
    start.speakerColor = "#ff758c";
    start.dialogue = "Hey! Glad you made it.\nWhere to?";
    start.portsOut = { {"out_coral", "coral", 120}, {"out_cyan", "cyan", 205} };
    s.nodes.append(start);

    Node choice;
    choice.id = "choice_deciding";
    choice.type = "choice";
    choice.title = "Choice:";
    choice.subtitle = "Deciding";
    choice.x = 385; choice.y = 135; choice.width = 225;
    choice.options = {
        {"opt_forest", "Go to Forest", "cyan", "cyan"},
        {"opt_school", "Explore School", "coral", "coral"},
    };
    s.nodes.append(choice);

    Node forest;
    forest.id = "forest_scene";
    forest.type = "compact_scene";
    forest.title = "Forest Scene";
    forest.x = 695; forest.y = 80; forest.width = 225;
    forest.characterId = "sora";
    forest.speaker = "Sora";
    forest.dialogue = "Hey! Glad you made it.\nWhere to?";
    s.nodes.append(forest);

    Node selector;
    selector.id = "char_selector";
    selector.type = "character_selector";
    selector.title = "Character Selector";
    selector.x = 695; selector.y = 265; selector.width = 230;
    selector.selectedCharId = "yuki";
    selector.expression = "Yuki - Joyful";
    selector.scale = 92;
    selector.position = 62;
    s.nodes.append(selector);

    s.wires = {
        {"w1", "start_scene_1", "out_coral", "choice_deciding", "in_opt_school", "coral"},
        {"w2", "start_scene_1", "out_cyan", "choice_deciding", "in_opt_forest", "cyan"},
        {"w3", "choice_deciding", "out_opt_forest", "forest_scene", "in_main", "cyan"},
        {"w4", "choice_deciding", "out_opt_school", "char_selector", "in_main", "coral"},
    };
    return s;
}

} // namespace graph
