cmake_minimum_required(VERSION 3.21)
project(MeProyectoStudioQt VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)

find_package(Qt6 REQUIRED COMPONENTS Widgets)

add_executable(mynovel
  src/main.cpp
  src/graph.cpp
  src/nodeitem.cpp
  src/wireitem.cpp
  src/canvasview.cpp
  src/mainwindow.cpp
)
target_include_directories(mynovel PRIVATE src)
target_link_libraries(mynovel PRIVATE Qt6::Widgets)

# Offscreen smoke test: renders the scene to PNGs (no display needed).
add_executable(smoke src/smoke.cpp src/graph.cpp src/nodeitem.cpp src/wireitem.cpp src/canvasview.cpp)
target_include_directories(smoke PRIVATE src)
target_link_libraries(smoke PRIVATE Qt6::Widgets)
