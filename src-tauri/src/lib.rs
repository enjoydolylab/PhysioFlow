use serde::Serialize;
use std::{
    env, fs,
    fs::OpenOptions,
    io::{Read, Seek, SeekFrom, Write},
    path::{Component, Path, PathBuf},
    process::Command,
    sync::atomic::{AtomicU64, Ordering},
};

const APP_DIR_NAME: &str = "PhysioFlow Data";
static WRITE_SEQUENCE: AtomicU64 = AtomicU64::new(0);

#[derive(Serialize)]
struct StorageInfo {
    supported: bool,
    selected: bool,
    name: String,
    permission: String,
    data_dir: String,
}

fn home_dir() -> Result<PathBuf, String> {
    if cfg!(target_os = "windows") {
        env::var_os("USERPROFILE")
            .map(PathBuf::from)
            .ok_or_else(|| "USERPROFILE is not set".to_string())
    } else {
        env::var_os("HOME")
            .map(PathBuf::from)
            .ok_or_else(|| "HOME is not set".to_string())
    }
}

fn data_dir() -> Result<PathBuf, String> {
    let documents = home_dir()?.join("Documents");
    Ok(documents.join(APP_DIR_NAME))
}

fn ensure_base_dirs() -> Result<PathBuf, String> {
    let dir = data_dir()?;
    for child in ["projects", "sessions", "assets"] {
        fs::create_dir_all(dir.join(child)).map_err(|err| err.to_string())?;
    }
    Ok(dir)
}

fn safe_join(relative: &str) -> Result<PathBuf, String> {
    let base = ensure_base_dirs()?;
    let mut out = base;
    for component in Path::new(relative).components() {
        match component {
            Component::Normal(part) => out.push(part),
            Component::CurDir => {}
            _ => return Err("Path traversal is not allowed".to_string()),
        }
    }
    Ok(out)
}

fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    let sequence = WRITE_SEQUENCE.fetch_add(1, Ordering::Relaxed);
    let name = path.file_name().and_then(|name| name.to_str()).unwrap_or("data");
    let temporary = path.with_file_name(format!(".{name}.{}.{}.tmp", std::process::id(), sequence));
    let write_result = (|| -> Result<(), String> {
        let mut file = OpenOptions::new().write(true).create_new(true).open(&temporary).map_err(|err| err.to_string())?;
        file.write_all(bytes).map_err(|err| err.to_string())?;
        file.sync_all().map_err(|err| err.to_string())?;
        Ok(())
    })();
    if let Err(error) = write_result {
        let _ = fs::remove_file(&temporary);
        return Err(error);
    }

    replace_file(&temporary, path)
}

fn replace_file(temporary: &Path, path: &Path) -> Result<(), String> {
    #[cfg(not(target_os = "windows"))]
    {
        fs::rename(&temporary, path).map_err(|err| { let _ = fs::remove_file(&temporary); err.to_string() })?;
    }
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::ffi::OsStrExt;
        #[link(name = "kernel32")]
        extern "system" {
            fn MoveFileExW(existing: *const u16, destination: *const u16, flags: u32) -> i32;
        }
        let source: Vec<u16> = temporary.as_os_str().encode_wide().chain(Some(0)).collect();
        let destination: Vec<u16> = path.as_os_str().encode_wide().chain(Some(0)).collect();
        // Same-directory replacement: keep the old destination in place until the
        // OS replaces it. Both null-terminated buffers live for the whole call.
        let result = unsafe { MoveFileExW(source.as_ptr(), destination.as_ptr(), 0x1 | 0x8) };
        if result == 0 {
            let error = std::io::Error::last_os_error();
            let _ = fs::remove_file(&temporary);
            return Err(error.to_string());
        }
    }
    Ok(())
}

#[tauri::command]
fn storage_info() -> Result<StorageInfo, String> {
    let dir = ensure_base_dirs()?;
    Ok(StorageInfo {
        supported: true,
        selected: true,
        name: APP_DIR_NAME.to_string(),
        permission: "granted".to_string(),
        data_dir: dir.to_string_lossy().to_string(),
    })
}

#[tauri::command]
fn select_data_directory() -> Result<StorageInfo, String> {
    storage_info()
}

#[tauri::command]
fn open_data_directory() -> Result<bool, String> {
    let dir = ensure_base_dirs()?;
    #[cfg(target_os = "macos")]
    let status = Command::new("open").arg(&dir).status();
    #[cfg(target_os = "windows")]
    let status = Command::new("explorer").arg(&dir).status();
    #[cfg(all(unix, not(target_os = "macos")))]
    let status = Command::new("xdg-open").arg(&dir).status();

    match status {
        Ok(result) if result.success() => Ok(true),
        Ok(result) => Err(format!("Could not open data folder. Exit status: {result}")),
        Err(err) => Err(err.to_string()),
    }
}

#[tauri::command]
fn read_text(path: String) -> Result<Option<String>, String> {
    let file = safe_join(&path)?;
    if !file.exists() {
        return Ok(None);
    }
    fs::read_to_string(file)
        .map(Some)
        .map_err(|err| err.to_string())
}

#[tauri::command]
fn write_text(path: String, text: String) -> Result<bool, String> {
    let file = safe_join(&path)?;
    atomic_write(&file, text.as_bytes())?;
    Ok(true)
}

#[tauri::command]
fn read_binary(path: String) -> Result<Option<Vec<u8>>, String> {
    let file = safe_join(&path)?;
    if !file.exists() {
        return Ok(None);
    }
    fs::read(file).map(Some).map_err(|err| err.to_string())
}

#[tauri::command]
fn write_binary(path: String, bytes: Vec<u8>) -> Result<bool, String> {
    let file = safe_join(&path)?;
    atomic_write(&file, &bytes)?;
    Ok(true)
}

const BINARY_CHUNK_SIZE: usize = 1024 * 1024;

fn upload_path(path: &Path, upload_id: &str) -> Result<PathBuf, String> {
    if upload_id.len() != 36 || !upload_id.chars().all(|c| c.is_ascii_hexdigit() || c == '-') {
        return Err("Invalid upload identifier".into());
    }
    let name = path.file_name().and_then(|s| s.to_str()).ok_or("Invalid filename")?;
    Ok(path.with_file_name(format!(".{name}.{upload_id}.upload")))
}

fn write_chunk(path: &Path, upload_id: &str, offset: u64, bytes: &[u8], final_chunk: bool) -> Result<bool, String> {
    if bytes.len() > BINARY_CHUNK_SIZE { return Err("Binary chunk too large".into()); }
    let temporary = upload_path(path, upload_id)?;
    if let Some(parent) = path.parent() { fs::create_dir_all(parent).map_err(|e| e.to_string())?; }
    let mut options = OpenOptions::new();
    options.write(true);
    if offset == 0 { options.create_new(true); }
    let mut file = options.open(&temporary).map_err(|e| e.to_string())?;
    if file.metadata().map_err(|e| e.to_string())?.len() != offset { return Err("Upload offset mismatch".into()); }
    file.seek(SeekFrom::Start(offset)).map_err(|e| e.to_string())?;
    file.write_all(bytes).map_err(|e| e.to_string())?;
    if final_chunk {
        file.sync_all().map_err(|e| e.to_string())?;
        drop(file);
        replace_file(&temporary, path)?;
    }
    Ok(true)
}

#[tauri::command]
fn binary_size(path: String) -> Result<Option<u64>, String> {
    let file = safe_join(&path)?;
    if !file.exists() { return Ok(None); }
    Ok(Some(fs::metadata(file).map_err(|e| e.to_string())?.len()))
}

#[tauri::command]
fn read_binary_chunk(path: String, offset: u64, length: usize) -> Result<Vec<u8>, String> {
    if length > BINARY_CHUNK_SIZE { return Err("Binary chunk too large".into()); }
    let mut file = fs::File::open(safe_join(&path)?).map_err(|e| e.to_string())?;
    file.seek(SeekFrom::Start(offset)).map_err(|e| e.to_string())?;
    let mut bytes = vec![0; length];
    file.read_exact(&mut bytes).map_err(|e| e.to_string())?;
    Ok(bytes)
}

#[tauri::command]
fn write_binary_chunk(path: String, upload_id: String, offset: u64, bytes: Vec<u8>, final_chunk: bool) -> Result<bool, String> {
    write_chunk(&safe_join(&path)?, &upload_id, offset, &bytes, final_chunk)
}

#[tauri::command]
fn abort_binary_upload(path: String, upload_id: String) -> Result<bool, String> {
    let temporary = upload_path(&safe_join(&path)?, &upload_id)?;
    if temporary.exists() { fs::remove_file(temporary).map_err(|e| e.to_string())?; }
    Ok(true)
}

#[tauri::command]
fn list_files(path: String) -> Result<Vec<String>, String> {
    let dir = safe_join(&path)?;
    let mut files = Vec::new();
    if !dir.exists() {
        return Ok(files);
    }
    for entry in fs::read_dir(dir).map_err(|err| err.to_string())? {
        let entry = entry.map_err(|err| err.to_string())?;
        if entry.file_type().map_err(|err| err.to_string())?.is_file() {
            files.push(entry.file_name().to_string_lossy().to_string());
        }
    }
    files.sort();
    Ok(files)
}

#[tauri::command]
fn list_directories(path: String) -> Result<Vec<String>, String> {
    let dir = safe_join(&path)?;
    let mut dirs = Vec::new();
    if !dir.exists() {
        return Ok(dirs);
    }
    for entry in fs::read_dir(dir).map_err(|err| err.to_string())? {
        let entry = entry.map_err(|err| err.to_string())?;
        if entry.file_type().map_err(|err| err.to_string())?.is_dir() {
            dirs.push(entry.file_name().to_string_lossy().to_string());
        }
    }
    dirs.sort();
    Ok(dirs)
}

#[tauri::command]
fn remove_entry(path: String) -> Result<bool, String> {
    let target = safe_join(&path)?;
    if !target.exists() {
        return Ok(false);
    }
    if target.is_dir() {
        fs::remove_dir_all(target).map_err(|err| err.to_string())?;
    } else {
        fs::remove_file(target).map_err(|err| err.to_string())?;
    }
    Ok(true)
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            storage_info,
            select_data_directory,
            open_data_directory,
            read_text,
            write_text,
            read_binary,
            write_binary,
            binary_size,
            read_binary_chunk,
            write_binary_chunk,
            abort_binary_upload,
            list_files,
            list_directories,
            remove_entry,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PhysioFlow");
}

#[cfg(test)]
mod tests {
    use super::{atomic_write, write_chunk, upload_path, BINARY_CHUNK_SIZE};
    use std::fs;

    #[test]
    fn atomic_write_creates_and_replaces_complete_content() {
        let path = std::env::temp_dir().join(format!("physioflow-atomic-write-{}.txt", std::process::id()));
        let _ = fs::remove_file(&path);
        atomic_write(&path, b"first complete value").unwrap();
        atomic_write(&path, b"replacement").unwrap();
        assert_eq!(fs::read(&path).unwrap(), b"replacement");
        fs::remove_file(path).unwrap();
    }

    #[test]
    fn chunked_upload_commits_only_complete_content() {
        let path = std::env::temp_dir().join(format!("physioflow-chunks-{}.bin", std::process::id()));
        let upload = "00000000-0000-4000-8000-000000000001";
        let _ = fs::remove_file(upload_path(&path, upload).unwrap());
        atomic_write(&path, b"original").unwrap();
        write_chunk(&path, upload, 0, b"first", false).unwrap();
        assert_eq!(fs::read(&path).unwrap(), b"original");
        assert!(write_chunk(&path, upload, 2, b"bad", false).is_err());
        assert!(write_chunk(&path, upload, 5, &vec![0; BINARY_CHUNK_SIZE + 1], false).is_err());
        write_chunk(&path, upload, 5, b" second", true).unwrap();
        assert_eq!(fs::read(&path).unwrap(), b"first second");
        assert!(!upload_path(&path, upload).unwrap().exists());
        assert!(upload_path(&path, "../bad").is_err());
        fs::remove_file(path).unwrap();
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn replacement_failure_preserves_original_file() {
        use std::os::windows::fs::OpenOptionsExt;
        let path = std::env::temp_dir().join(format!("physioflow-locked-write-{}.txt", std::process::id()));
        atomic_write(&path, b"original").unwrap();
        let lock = fs::OpenOptions::new().read(true).share_mode(1).open(&path).unwrap();
        assert!(atomic_write(&path, b"new data").is_err());
        assert_eq!(fs::read(&path).unwrap(), b"original");
        drop(lock);
        fs::remove_file(path).unwrap();
    }
}
