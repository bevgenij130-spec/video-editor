//! Video editor backend skeleton (Tauri 2).
//!
//! Modules are placeholders only — no decoding/timeline/export logic yet.

pub mod audio;
pub mod commands;
pub mod decoder;
pub mod gpu;
pub mod project;
pub mod proxy;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}! Video editor is ready.", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
