// Verifies serve.h over real HTTP (regression test for the file:// CORS issue).
#include "serve.h"

#include <cassert>
#include <cstdio>
#include <string>

int main() {
    servo::Server srv;
    std::string url;
    if (!servo::start(srv, FIXTURE_DIR, url)) {
        std::printf("FAIL start\n");
        return 1;
    }
    const std::string base = url.substr(0, url.rfind('/'));
    httplib::Client cli("127.0.0.1", srv.port);
    auto page = cli.Get("/index.html");
    auto js = cli.Get("/app.js");
    auto css = cli.Get("/style.css");
    bool ok = page && page->status == 200 &&
              js && js->status == 200 &&
              js->has_header("Content-Type") &&
              js->get_header_value("Content-Type").find("javascript") != std::string::npos &&
              css && css->status == 200 &&
              page->body.find("PROBE-MARKER") != std::string::npos;
    std::printf("%s port=%d js-type=%s\n", ok ? "OK" : "FAIL", srv.port,
                js && js->has_header("Content-Type")
                    ? js->get_header_value("Content-Type").c_str()
                    : "<none>");
    servo::stop(srv);
    return ok ? 0 : 1;
}
