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
FetchContent_Declare(
  httplib
  GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
  GIT_TAG v0.20.1
)
FetchContent_MakeAvailable(webview httplib)

find_package(Threads REQUIRED)

add_executable(vnstudio src/main.cpp)
target_link_libraries(vnstudio PRIVATE webview::core httplib::httplib Threads::Threads)

add_executable(testserve test/testserve.cpp)
target_include_directories(testserve PRIVATE src)
target_link_libraries(testserve PRIVATE httplib::httplib Threads::Threads)
target_compile_definitions(testserve PRIVATE
  FIXTURE_DIR="${CMAKE_CURRENT_SOURCE_DIR}/test/fixture")
