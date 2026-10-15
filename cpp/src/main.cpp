// C++ native shell hosting the Svelte web UI (dist/).
// UI elements live in src/ (Svelte) — this binary only contains them
// and exposes native bindings (see App::bindAll).
#include "webview.h"

#include <filesystem>
#include <iostream>
#include <string>

namespace fs = std::filesystem;

namespace {

// dist/index.html sits two levels above the binary (cpp/build/vnstudio).
std::string findDist(const char *argv0) {
    try {
        fs::path exe = fs::canonical(fs::path(argv0));
        for (const fs::path &cand :
             {exe.parent_path() / ".." / ".." / "dist" / "index.html"}) {
            std::error_code ec;
            if (fs::exists(cand, ec))
                return std::string("file://") + fs::canonical(cand, ec).string();
        }
    } catch (...) {
    }
    if (const char *env = std::getenv("VN_DIST"))
        return std::string("file://") + env;
    return "http://localhost:1420/"; // Dev fallback: `npm run dev`.
}

} // namespace

int main(int argc, char **argv) {
    (void)argc;
    webview::webview w(true, nullptr);
    w.set_title("My Novel — Visual Novel Node Studio (C++)");
    w.set_size(1280, 800, WEBVIEW_HINT_NONE);

    // Native bridge (called from JS as window.appVersion()).
    w.bind("appVersion", [](const std::string &) -> std::string {
        return "\"0.1.0-cpp\"";
    });

    const std::string url = (argc > 0 && argv[0]) ? findDist(argv[0]) : "";
    std::cout << "loading: " << (url.empty() ? "<none>" : url) << std::endl;
    if (!url.empty())
        w.navigate(url);
    w.run();
    return 0;
}
