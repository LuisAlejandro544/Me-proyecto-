cmake_minimum_required(VERSION 3.21)
project(MeProyectoCppShell VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
FetchContent_Declare(
  webview
  GIT_REPOSITORY https://github.com/webview/webview.git
  GIT_TAG 0.12.0
)
FetchContent_MakeAvailable(webview)

add_executable(vnstudio src/main.cpp)
target_link_libraries(vnstudio PRIVATE webview::core)
