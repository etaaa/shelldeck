use std::{
    collections::BTreeMap,
    ffi::OsString,
    io::Read,
    sync::{
        atomic::{AtomicU32, Ordering},
        Arc,
    },
};

use portable_pty::{native_pty_system, Child, ChildKiller, CommandBuilder, PtyPair, PtySize};
use tokio::sync::{Mutex, RwLock};

type PtyHandler = u32;

#[derive(Default)]
pub struct PtyState {
    session_id: AtomicU32,
    sessions: RwLock<BTreeMap<PtyHandler, Arc<Session>>>,
}

struct Session {
    pair: Mutex<PtyPair>,
    _child: Mutex<Box<dyn Child + Send + Sync>>,
    child_killer: Mutex<Box<dyn ChildKiller + Send + Sync>>,
    writer: Mutex<Box<dyn std::io::Write + Send>>,
    reader: Mutex<Box<dyn Read + Send>>,
    /// Separate mutex for blocking wait, so it doesn't conflict with async locks.
    child_waiter: std::sync::Mutex<Option<Box<dyn Child + Send + Sync>>>,
}

fn get_session(
    sessions: &BTreeMap<PtyHandler, Arc<Session>>,
    pid: PtyHandler,
) -> Result<Arc<Session>, String> {
    sessions
        .get(&pid)
        .cloned()
        .ok_or_else(|| "Unavailable pid".to_string())
}

#[tauri::command]
pub async fn pty_spawn(
    file: String,
    args: Vec<String>,
    cols: u16,
    rows: u16,
    cwd: Option<String>,
    env: BTreeMap<String, String>,
    state: tauri::State<'_, PtyState>,
) -> Result<PtyHandler, String> {
    let pty_system = native_pty_system();

    let pair = pty_system
        .openpty(PtySize {
            rows: rows.max(1),
            cols: cols.max(1),
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;
    let reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;

    let mut cmd = CommandBuilder::new(file);
    cmd.args(args);
    if let Some(cwd) = cwd {
        cmd.cwd(OsString::from(cwd));
    }
    for (k, v) in env.iter() {
        cmd.env(OsString::from(k), OsString::from(v));
    }

    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    let child_killer = child.clone_killer();
    let child_waiter = child.clone_killer();
    let handler = state.session_id.fetch_add(1, Ordering::Relaxed);

    // We need a second Child handle for wait(). clone_killer gives us a ChildKiller,
    // but we need Child for wait(). We'll store the original child for waiting.
    let session = Arc::new(Session {
        pair: Mutex::new(pair),
        _child: Mutex::new(Box::new(NullChild)),
        child_killer: Mutex::new(child_killer),
        writer: Mutex::new(writer),
        reader: Mutex::new(reader),
        child_waiter: std::sync::Mutex::new(Some(child)),
    });
    let _ = child_waiter; // ChildKiller not needed separately
    state.sessions.write().await.insert(handler, session);
    Ok(handler)
}

/// Placeholder since we moved the real child to child_waiter.
#[derive(Debug)]
struct NullChild;
impl Child for NullChild {
    fn try_wait(&mut self) -> std::io::Result<Option<portable_pty::ExitStatus>> {
        Ok(None)
    }
    fn wait(&mut self) -> std::io::Result<portable_pty::ExitStatus> {
        Err(std::io::Error::new(std::io::ErrorKind::Other, "use child_waiter"))
    }
    fn process_id(&self) -> Option<u32> {
        None
    }
}
impl ChildKiller for NullChild {
    fn kill(&mut self) -> std::io::Result<()> {
        Ok(())
    }
    fn clone_killer(&self) -> Box<dyn ChildKiller + Send + Sync> {
        Box::new(NullChild)
    }
}

#[tauri::command]
pub async fn pty_write(
    pid: PtyHandler,
    data: String,
    state: tauri::State<'_, PtyState>,
) -> Result<(), String> {
    let session = get_session(&*state.sessions.read().await, pid)?;
    let mut writer = session.writer.lock().await;
    use std::io::Write;
    writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn pty_read(
    pid: PtyHandler,
    state: tauri::State<'_, PtyState>,
) -> Result<Vec<u8>, String> {
    let session = get_session(&*state.sessions.read().await, pid)?;

    // Run blocking read on the blocking thread pool, not on a Tokio worker.
    tokio::task::spawn_blocking(move || {
        let mut reader = session.reader.blocking_lock();
        let mut buf = vec![0u8; 4096];
        let n = reader.read(&mut buf).map_err(|e: std::io::Error| e.to_string())?;
        if n == 0 {
            Err::<Vec<u8>, String>("EOF".to_string())
        } else {
            buf.truncate(n);
            Ok(buf)
        }
    })
    .await
    .map_err(|e: tokio::task::JoinError| e.to_string())?
}

#[tauri::command]
pub async fn pty_resize(
    pid: PtyHandler,
    cols: u16,
    rows: u16,
    state: tauri::State<'_, PtyState>,
) -> Result<(), String> {
    let session = get_session(&*state.sessions.read().await, pid)?;
    session
        .pair
        .lock()
        .await
        .master
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn pty_kill(
    pid: PtyHandler,
    state: tauri::State<'_, PtyState>,
) -> Result<(), String> {
    let session = get_session(&*state.sessions.read().await, pid)?;
    session
        .child_killer
        .lock()
        .await
        .kill()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn pty_exitstatus(
    pid: PtyHandler,
    state: tauri::State<'_, PtyState>,
) -> Result<u32, String> {
    let session = get_session(&*state.sessions.read().await, pid)?;

    // Run blocking wait on the blocking thread pool, not on a Tokio worker.
    tokio::task::spawn_blocking(move || {
        let mut guard = session
            .child_waiter
            .lock()
            .map_err(|e: std::sync::PoisonError<_>| e.to_string())?;
        let child = guard.as_mut().ok_or("Child already consumed")?;
        let status = child.wait().map_err(|e: std::io::Error| e.to_string())?;
        Ok::<u32, String>(status.exit_code())
    })
    .await
    .map_err(|e: tokio::task::JoinError| e.to_string())?
}
