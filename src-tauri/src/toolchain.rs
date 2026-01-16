use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolchainConfig {
    pub auto_detect: bool,
    pub toolchain_root: Option<String>,
    pub nm_path: Option<String>,
    pub objdump_path: Option<String>,
    pub strings_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolchainPaths {
    pub nm_path: String,
    pub objdump_path: String,
    pub strings_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolchainCandidate {
    pub source: String,
    pub paths: ToolchainPaths,
}

#[tauri::command]
pub fn detect_toolchain(config: Option<ToolchainConfig>) -> Result<Vec<ToolchainCandidate>, String> {
    let mut results = Vec::new();

    if let Some(cfg) = config {
        if let Some(paths) = resolve_from_config(&cfg)? {
            results.push(ToolchainCandidate {
                source: "config".to_string(),
                paths,
            });
            return Ok(results);
        }
    }

    if let Some(paths) = resolve_from_path()? {
        results.push(ToolchainCandidate {
            source: "path".to_string(),
            paths,
        });
        return Ok(results);
    }

    if let Some(paths) = resolve_from_common_paths()? {
        results.push(ToolchainCandidate {
            source: "common".to_string(),
            paths,
        });
    }

    Ok(results)
}

pub fn resolve_toolchain(config: Option<&ToolchainConfig>) -> Result<ToolchainPaths, String> {
    if let Some(cfg) = config {
        if let Some(paths) = resolve_from_config(cfg)? {
            return Ok(paths);
        }
        if !cfg.auto_detect {
            return Err("Toolchain paths are not configured.".to_string());
        }
    }

    if let Some(paths) = resolve_from_path()? {
        return Ok(paths);
    }

    if let Some(paths) = resolve_from_common_paths()? {
        return Ok(paths);
    }

    Err("Failed to detect arm-none-eabi toolchain on PATH.".to_string())
}

fn resolve_from_config(config: &ToolchainConfig) -> Result<Option<ToolchainPaths>, String> {
    let nm = resolve_specific_path("arm-none-eabi-nm", config.nm_path.as_deref(), config.toolchain_root.as_deref())?;
    let objdump =
        resolve_specific_path("arm-none-eabi-objdump", config.objdump_path.as_deref(), config.toolchain_root.as_deref())?;
    let strings =
        resolve_specific_path("arm-none-eabi-strings", config.strings_path.as_deref(), config.toolchain_root.as_deref())?;

    if nm.is_some() && objdump.is_some() && strings.is_some() {
        return Ok(Some(ToolchainPaths {
            nm_path: nm.unwrap(),
            objdump_path: objdump.unwrap(),
            strings_path: strings.unwrap(),
        }));
    }

    Ok(None)
}

fn resolve_specific_path(
    tool: &str,
    explicit: Option<&str>,
    root: Option<&str>,
) -> Result<Option<String>, String> {
    if let Some(path) = explicit {
        if path_exists(path) {
            return Ok(Some(path.to_string()));
        }
        return Err(format!("Toolchain path not found: {}", path));
    }

    if let Some(root) = root {
        let candidate = guess_from_root(root, tool);
        if path_exists(&candidate) {
            return Ok(Some(candidate));
        }
    }

    Ok(None)
}

fn resolve_from_path() -> Result<Option<ToolchainPaths>, String> {
    let nm = find_in_path("arm-none-eabi-nm");
    let objdump = find_in_path("arm-none-eabi-objdump");
    let strings = find_in_path("arm-none-eabi-strings");

    if let (Some(nm_path), Some(objdump_path), Some(strings_path)) = (nm, objdump, strings) {
        Ok(Some(ToolchainPaths {
            nm_path,
            objdump_path,
            strings_path,
        }))
    } else {
        Ok(None)
    }
}

fn resolve_from_common_paths() -> Result<Option<ToolchainPaths>, String> {
    let roots = common_roots();
    for root in roots {
        if let Some(paths) = find_toolchain_in_root(&root)? {
            return Ok(Some(paths));
        }
    }
    Ok(None)
}

fn guess_from_root(root: &str, tool: &str) -> String {
    let suffix = if cfg!(windows) { ".exe" } else { "" };
    let mut base = PathBuf::from(root);
    if base.file_name().map(|name| name.to_string_lossy().to_lowercase()) != Some("bin".to_string()) {
        base.push("bin");
    }
    base.push(format!("{}{}", tool, suffix));
    base.to_string_lossy().to_string()
}

fn find_in_path(tool: &str) -> Option<String> {
    let suffix = if cfg!(windows) { ".exe" } else { "" };
    let target = format!("{}{}", tool, suffix);
    let path_var = env::var_os("PATH")?;
    for entry in env::split_paths(&path_var) {
        let candidate = entry.join(&target);
        if candidate.exists() {
            return Some(candidate.to_string_lossy().to_string());
        }
    }
    None
}

fn path_exists(path: &str) -> bool {
    Path::new(path).exists()
}

fn common_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();
    if cfg!(windows) {
        let base_roots = [
            r"C:\Program Files\Arm GNU Toolchain",
            r"C:\Program Files (x86)\Arm GNU Toolchain",
            r"C:\Program Files\GNU Arm Embedded Toolchain",
            r"C:\Program Files (x86)\GNU Arm Embedded Toolchain",
            r"C:\Program Files\gcc-arm-none-eabi",
            r"C:\Program Files (x86)\gcc-arm-none-eabi",
            r"C:\ARM\gcc-arm-none-eabi",
            r"C:\GNU Arm Embedded Toolchain",
        ];
        for root in base_roots {
            roots.push(PathBuf::from(root));
        }
    } else {
        let base_roots = ["/usr", "/usr/local", "/opt", "/opt/arm", "/opt/gcc-arm-none-eabi"];
        for root in base_roots {
            roots.push(PathBuf::from(root));
        }
    }
    roots
}

fn find_toolchain_in_root(root: &Path) -> Result<Option<ToolchainPaths>, String> {
    let tool = format!("arm-none-eabi-nm{}", if cfg!(windows) { ".exe" } else { "" });
    if root.join("bin").join(&tool).exists() {
        return build_paths_from_bin(&root.join("bin"));
    }

    if !root.exists() {
        return Ok(None);
    }

    let entries = fs::read_dir(root).map_err(|e| format!("Failed to scan {}: {}", root.display(), e))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let bin = path.join("bin");
        if bin.join(&tool).exists() {
            return build_paths_from_bin(&bin);
        }
    }

    Ok(None)
}

fn build_paths_from_bin(bin_dir: &Path) -> Result<Option<ToolchainPaths>, String> {
    let suffix = if cfg!(windows) { ".exe" } else { "" };
    let nm = bin_dir.join(format!("arm-none-eabi-nm{}", suffix));
    let objdump = bin_dir.join(format!("arm-none-eabi-objdump{}", suffix));
    let strings = bin_dir.join(format!("arm-none-eabi-strings{}", suffix));
    if nm.exists() && objdump.exists() && strings.exists() {
        return Ok(Some(ToolchainPaths {
            nm_path: nm.to_string_lossy().to_string(),
            objdump_path: objdump.to_string_lossy().to_string(),
            strings_path: strings.to_string_lossy().to_string(),
        }));
    }
    Ok(None)
}
