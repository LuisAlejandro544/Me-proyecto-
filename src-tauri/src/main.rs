//! Tauri v2 entry. Web frontend lives in dist/ (Vite + Svelte + TS).
//! Replaces the old "Export Win (.exe)" fake-modal: now we build a real .exe via `npm run tauri:build`.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
