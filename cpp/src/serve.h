#pragma once
// Minimal local HTTP server for dist/ (file:// is origin-null and every
// engine blocks its CSS/JS by CORS). Header-only via cpp-httplib.
#include "httplib.h"

#include <string>
#include <thread>

namespace servo {

struct Server {
    std::unique_ptr<httplib::Server> svr;
    std::thread th;
    int port = -1;
};

// Serves `root` on 127.0.0.1 (first free port 1421..1459).
// Returns true + sets url_out (…/index.html). Non-blocking.
inline bool start(Server &s, const std::string &root, std::string &url_out) {
    for (int port = 1421; port < 1460; ++port) {
        auto svr = std::make_unique<httplib::Server>();
        svr->set_mount_point("/", root);
        if (!svr->bind_to_port("127.0.0.1", port))
            continue;
        s.svr = std::move(svr);
        s.port = port;
        s.th = std::thread([&s] { s.svr->listen_after_bind(); });
        url_out = "http://127.0.0.1:" + std::to_string(port) + "/index.html";
        return true;
    }
    return false;
}

inline void stop(Server &s) {
    if (s.svr)
        s.svr->stop();
    if (s.th.joinable())
        s.th.join();
}

} // namespace servo
