use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

fn store_path(app: &AppHandle, filename: &str) -> PathBuf {
    let dir = app.path().app_data_dir().expect("failed to get app data dir");
    fs::create_dir_all(&dir).ok();
    dir.join(filename)
}

fn read_json(path: &PathBuf) -> Value {
    match fs::read_to_string(path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or(Value::Null),
        Err(_) => Value::Null,
    }
}

fn write_json(path: &PathBuf, value: &Value) {
    if let Ok(content) = serde_json::to_string_pretty(value) {
        fs::write(path, content).ok();
    }
}

fn get_json(app: &AppHandle, filename: &str, default: Value) -> Value {
    let val = read_json(&store_path(app, filename));
    if val.is_null() { default } else { val }
}

fn save_json(app: &AppHandle, filename: &str, value: &Value) {
    write_json(&store_path(app, filename), value);
}

#[tauri::command]
pub fn get_projects(app: AppHandle) -> Value {
    get_json(&app, "projects.json", Value::Array(vec![]))
}

#[tauri::command]
pub fn save_projects(app: AppHandle, projects: Value) {
    save_json(&app, "projects.json", &projects);
}

#[tauri::command]
pub fn get_sessions(app: AppHandle) -> Value {
    get_json(&app, "sessions.json", Value::Array(vec![]))
}

#[tauri::command]
pub fn save_sessions(app: AppHandle, sessions: Value) {
    save_json(&app, "sessions.json", &sessions);
}

#[tauri::command]
pub fn get_settings(app: AppHandle) -> Value {
    get_json(&app, "settings.json", Value::Object(serde_json::Map::new()))
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: Value) {
    let path = store_path(&app, "settings.json");
    let mut existing = match read_json(&path) {
        Value::Object(map) => map,
        _ => serde_json::Map::new(),
    };
    if let Value::Object(incoming) = settings {
        for (k, v) in incoming {
            existing.insert(k, v);
        }
    }
    write_json(&path, &Value::Object(existing));
}
