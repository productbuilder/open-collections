#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use keyring::Entry;
use keyring::credential::CredentialPersistence;
use rfd::FileDialog;
use serde::Serialize;
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

#[derive(Serialize)]
struct OpenFileResult {
    path: String,
    name: String,
    text: String,
}

#[derive(Serialize)]
struct DirEntryResult {
    path: String,
    name: String,
    kind: String,
}

fn log_keyring_event(event: &str, namespace: &str, account: &str, detail: &str) {
    eprintln!(
        "[tauri-keyring] {} namespace=\"{}\" account=\"{}\" {}",
        event, namespace, account, detail
    );
}

fn keyring_persistence_label() -> &'static str {
    match keyring::default::default_credential_builder().persistence() {
        CredentialPersistence::EntryOnly => "entry-only",
        CredentialPersistence::ProcessOnly => "process-only",
        CredentialPersistence::UntilReboot => "until-reboot",
        CredentialPersistence::UntilDelete => "until-delete",
        _ => "unknown",
    }
}

fn open_file_with_filter_json(only_json: bool) -> Result<Option<OpenFileResult>, String> {
    let mut dialog = FileDialog::new();
    if only_json {
        dialog = dialog.add_filter("JSON", &["json"]);
    }

    let path = dialog.pick_file();
    let Some(path) = path else {
        return Ok(None);
    };

    let text = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let name = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or_default()
        .to_string();

    Ok(Some(OpenFileResult {
        path: path.to_string_lossy().into_owned(),
        name,
        text,
    }))
}

#[tauri::command]
fn platform_open_text_file() -> Result<Option<OpenFileResult>, String> {
    open_file_with_filter_json(false)
}

#[tauri::command]
fn platform_open_json_file() -> Result<Option<OpenFileResult>, String> {
    open_file_with_filter_json(true)
}

#[tauri::command]
fn platform_save_text_file(text: String, suggested_name: String) -> Result<Option<OpenFileResult>, String> {
    let file = FileDialog::new().set_file_name(&suggested_name).save_file();
    let Some(path) = file else {
        return Ok(None);
    };

    fs::write(&path, &text).map_err(|e| e.to_string())?;

    let name = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or_default()
        .to_string();

    Ok(Some(OpenFileResult {
        path: path.to_string_lossy().into_owned(),
        name,
        text,
    }))
}

#[tauri::command]
fn platform_open_directory() -> Option<String> {
    FileDialog::new()
        .pick_folder()
        .map(|p| p.to_string_lossy().into_owned())
}

#[tauri::command]
fn platform_read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn platform_read_binary_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn platform_write_text_file(path: String, text: String) -> Result<(), String> {
    fs::write(path, text).map_err(|e| e.to_string())
}

#[tauri::command]
fn platform_write_binary_file(path: String, bytes: Vec<u8>) -> Result<(), String> {
    fs::write(path, bytes).map_err(|e| e.to_string())
}

#[tauri::command]
fn platform_join_path(base: String, name: String) -> Result<String, String> {
    Ok(Path::new(&base).join(name).to_string_lossy().into_owned())
}

#[tauri::command]
fn platform_create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn platform_file_exists(path: String) -> bool {
    Path::new(&path).is_file()
}

#[tauri::command]
fn platform_directory_exists(path: String) -> bool {
    Path::new(&path).is_dir()
}

#[tauri::command]
fn platform_read_directory(path: String) -> Result<Vec<DirEntryResult>, String> {
    let mut out: Vec<DirEntryResult> = vec![];
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let entry_path = entry.path();
        let kind = if entry_path.is_dir() { "directory" } else { "file" }.to_string();
        let name = entry
            .file_name()
            .to_str()
            .unwrap_or_default()
            .to_string();

        out.push(DirEntryResult {
            path: entry_path.to_string_lossy().into_owned(),
            name,
            kind,
        });
    }

    out.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(out)
}

fn workspace_state_path<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("workspace-state.json"))
}

#[tauri::command]
fn platform_remember_workspace_state<R: tauri::Runtime>(app: tauri::AppHandle<R>, snapshot: Value) -> Result<(), String> {
    let file_path = workspace_state_path(&app)?;
    let text = serde_json::to_string_pretty(&snapshot).map_err(|e| e.to_string())?;
    fs::write(file_path, text).map_err(|e| e.to_string())
}

#[tauri::command]
fn platform_load_workspace_state<R: tauri::Runtime>(app: tauri::AppHandle<R>) -> Result<Option<Value>, String> {
    let file_path = workspace_state_path(&app)?;
    if !file_path.exists() {
        return Ok(None);
    }
    let text = fs::read_to_string(file_path).map_err(|e| e.to_string())?;
    let value: Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    Ok(Some(value))
}



#[tauri::command]
fn platform_set_credential(namespace: String, account: String, secret: String) -> Result<(), String> {
    log_keyring_event(
        "set:start",
        &namespace,
        &account,
        &format!(
            "secret_length={} persistence={}",
            secret.len(),
            keyring_persistence_label()
        ),
    );
    let entry = Entry::new(&namespace, &account).map_err(|e| e.to_string())?;
    match entry.set_password(&secret) {
        Ok(()) => {
            log_keyring_event("set:ok", &namespace, &account, "");
            match entry.get_password() {
                Ok(read_back) => {
                    if read_back == secret {
                        log_keyring_event(
                            "set:verify:ok",
                            &namespace,
                            &account,
                            &format!("secret_length={}", read_back.len()),
                        );
                        Ok(())
                    } else {
                        log_keyring_event(
                            "set:verify:mismatch",
                            &namespace,
                            &account,
                            &format!(
                                "expected_length={} actual_length={}",
                                secret.len(),
                                read_back.len()
                            ),
                        );
                        Err("Credential write verification failed: read-back value did not match.".to_string())
                    }
                }
                Err(error) => {
                    log_keyring_event(
                        "set:verify:error",
                        &namespace,
                        &account,
                        &format!("error={}", error),
                    );
                    Err(format!(
                        "Credential write verification failed: unable to read back saved credential ({error})"
                    ))
                }
            }
        }
        Err(error) => {
            log_keyring_event("set:error", &namespace, &account, &format!("error={}", error));
            Err(error.to_string())
        }
    }
}

#[tauri::command]
fn platform_get_credential(namespace: String, account: String) -> Result<Option<String>, String> {
    log_keyring_event(
        "get:start",
        &namespace,
        &account,
        &format!("persistence={}", keyring_persistence_label()),
    );
    let entry = Entry::new(&namespace, &account).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(secret) => {
            log_keyring_event(
                "get:hit",
                &namespace,
                &account,
                &format!("secret_length={}", secret.len()),
            );
            Ok(Some(secret))
        }
        Err(keyring::Error::NoEntry) => {
            log_keyring_event("get:miss", &namespace, &account, "");
            Ok(None)
        }
        Err(error) => {
            log_keyring_event("get:error", &namespace, &account, &format!("error={}", error));
            Err(error.to_string())
        }
    }
}

#[tauri::command]
fn platform_delete_credential(namespace: String, account: String) -> Result<(), String> {
    log_keyring_event(
        "delete:start",
        &namespace,
        &account,
        &format!("persistence={}", keyring_persistence_label()),
    );
    let entry = Entry::new(&namespace, &account).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(_) => {
            log_keyring_event("delete:ok", &namespace, &account, "");
            Ok(())
        }
        Err(keyring::Error::NoEntry) => {
            log_keyring_event("delete:miss", &namespace, &account, "");
            Ok(())
        }
        Err(error) => {
            log_keyring_event("delete:error", &namespace, &account, &format!("error={}", error));
            Err(error.to_string())
        }
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            platform_open_text_file,
            platform_open_json_file,
            platform_save_text_file,
            platform_open_directory,
            platform_read_text_file,
            platform_read_binary_file,
            platform_write_text_file,
            platform_write_binary_file,
            platform_join_path,
            platform_create_directory,
            platform_file_exists,
            platform_directory_exists,
            platform_read_directory,
            platform_remember_workspace_state,
            platform_load_workspace_state,
            platform_set_credential,
            platform_get_credential,
            platform_delete_credential,
        ])
        .run(tauri::generate_context!())
        .expect("error while running open collections workbench");
}
