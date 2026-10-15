// C++ native shell hosting the Svelte web UI (dist/).
// UI elements live in src/ (Svelte) — this binary only contains them
// and exposes native bindings (see App::bindAll).
#include "serve.h"
#include "webview.h"

#include <chrono>
#include <filesystem>
#include <iostream>
#include <string>
#include <thread>

namespace fs = std::filesystem;

namespace {

// dist/ sits two levels above the binary (cpp/build/vnstudio).
std::string findDistDir(const char *argv0) {
    try {
        fs::path exe = fs::canonical(fs::path(argv0));
        fs::path cand = exe.parent_path() / ".." / ".." / "dist";
        std::error_code ec;
        if (fs::is_directory(cand, ec))
            return fs::canonical(cand, ec).string();
    } catch (...) {
    }
    if (const char *env = std::getenv("VN_DIST"))
        return env;
    return {};
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

    servo::Server srv;
    std::string url;
    const std::string dir = (argc > 0 && argv[0]) ? findDistDir(argv[0]) : std::string();
    if (!dir.empty() && servo::start(srv, dir, url)) {
        std::this_thread::sleep_for(std::chrono::milliseconds(300));
    } else if (!dir.empty()) {
        url = std::string("file://") + dir + "/index.html"; // last resort (CORS-limited)
    } else {
        url = "http://localhost:1420/"; // Dev fallback: `npm run dev`.
    }
    std::cout << "loading: " << url << std::endl;
    w.navigate(url);
    w.run();
    servo::stop(srv);
    return 0;
}
