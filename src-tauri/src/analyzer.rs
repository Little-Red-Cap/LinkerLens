use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::{BufRead, Read};
use std::process::Command;
use std::sync::Mutex;
use tauri::Manager;
use crate::fs_utils::write_atomic;
use crate::toolchain::{resolve_toolchain, ToolchainConfig, ToolchainPaths};

#[derive(Default)]
pub struct AppState {
    pub symbols: Mutex<Vec<SymbolInfo>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyzeParams {
    pub elf_path: String,
    pub map_path: Option<String>,
    pub toolchain: Option<ToolchainConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub meta: AnalysisMeta,
    pub summary: AnalysisSummary,
    pub sections: Vec<SectionInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisMeta {
    pub elf_path: String,
    pub map_path: Option<String>,
    pub toolchain: ToolchainPaths,
    pub cache: CacheMeta,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisSummary {
    pub sections_totals: SectionTotals,
    pub top_symbols: Vec<SymbolInfo>,
    pub top_objects: Vec<ObjectContribution>,
    pub top_libraries: Vec<ObjectContribution>,
    pub top_sections: Vec<ObjectContribution>,
    pub map_tree: Vec<TreeNode>,
    pub memory_regions: Vec<MemoryRegion>,
    pub findings: Vec<Finding>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SectionTotals {
    pub flash_bytes: u64,
    pub ram_bytes: u64,
    pub text_bytes: u64,
    pub rodata_bytes: u64,
    pub data_bytes: u64,
    pub bss_bytes: u64,
    pub flash_region_bytes: Option<u64>,
    pub ram_region_bytes: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SectionInfo {
    pub name: String,
    pub size: u64,
    pub vma: Option<String>,
    pub lma: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SymbolInfo {
    pub name: String,
    pub size: u64,
    pub addr: Option<String>,
    pub kind: String,
    pub section_guess: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObjectContribution {
    pub name: String,
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreeNode {
    pub name: String,
    pub size: u64,
    pub children: Vec<TreeNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryRegion {
    pub name: String,
    pub origin: String,
    pub length: u64,
    pub used: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Finding {
    pub id: String,
    pub severity: String,
    pub value: u64,
    pub items: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheMeta {
    pub hit: bool,
    pub key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PcLookupResult {
    pub address: String,
    pub symbol: Option<PcLookupSymbol>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PcLookupSymbol {
    pub name: String,
    pub addr: String,
    pub size: u64,
    pub kind: String,
    pub section_guess: String,
    pub offset: u64,
}
#[tauri::command]
pub fn analyze_firmware(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    params: AnalyzeParams,
) -> Result<AnalysisResult, String> {
    validate_inputs(&params)?;
    let toolchain_paths = resolve_toolchain(params.toolchain.as_ref())?;
    let cache_key = build_cache_key(&toolchain_paths, &params)?;
    if let Some(mut result) = load_cached_result(&app, &cache_key)? {
        result.meta.cache = CacheMeta {
            hit: true,
            key: cache_key.clone(),
        };
        if let Some(symbols) = load_cached_symbols(&app, &cache_key)? {
            if let Ok(mut stored) = state.symbols.lock() {
                *stored = symbols;
            }
        }
        return Ok(result);
    }

    let objdump_out = run_command(&toolchain_paths.objdump_path, &["-h", &params.elf_path])?;
    let sections = parse_objdump_sections(&objdump_out);

    let nm_out = run_command(
        &toolchain_paths.nm_path,
        &["-S", "--size-sort", &params.elf_path],
    )?;
    let mut all_symbols = parse_nm_symbols(&nm_out);
    let mut symbols = all_symbols.clone();
    symbols.sort_by(|a, b| b.size.cmp(&a.size));
    symbols.truncate(50);

    let totals = compute_section_totals(&sections);
    let (top_objects, top_libraries, top_sections, map_tree, memory_regions) =
        if let Some(map_path) = params.map_path.as_ref() {
            parse_map_contributions(map_path)?
    } else {
        (Vec::new(), Vec::new(), Vec::new(), Vec::new(), Vec::new())
    };
    let totals = apply_region_totals(totals, &memory_regions);
    let strings_count = count_strings_lines(&toolchain_paths.strings_path, &params.elf_path).ok();
    let findings = compute_findings(&mut all_symbols, &sections, strings_count);
    if let Ok(mut stored) = state.symbols.lock() {
        *stored = all_symbols.clone();
    }

    let result = AnalysisResult {
        meta: AnalysisMeta {
            elf_path: params.elf_path,
            map_path: params.map_path,
            toolchain: toolchain_paths,
            cache: CacheMeta {
                hit: false,
                key: cache_key.clone(),
            },
        },
        summary: AnalysisSummary {
            sections_totals: totals,
            top_symbols: symbols,
            top_objects,
            top_libraries,
            top_sections,
            map_tree,
            memory_regions,
            findings,
        },
        sections,
    };

    store_cached_result(&app, &cache_key, &result)?;
    store_cached_symbols(&app, &cache_key, &all_symbols)?;
    Ok(result)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SymbolQuery {
    pub query: Option<String>,
    pub page: usize,
    pub page_size: usize,
    pub sort: Option<String>,
    pub order: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PagedSymbols {
    pub total: usize,
    pub items: Vec<SymbolInfo>,
}

#[tauri::command]
pub fn list_symbols(state: tauri::State<'_, AppState>, query: SymbolQuery) -> Result<PagedSymbols, String> {
    let data = state.symbols.lock().map_err(|_| "Failed to read symbols cache.".to_string())?;
    if data.is_empty() {
        return Ok(PagedSymbols {
            total: 0,
            items: Vec::new(),
        });
    }

    let mut items: Vec<SymbolInfo> = data
        .iter()
        .filter(|symbol| match query.query.as_ref() {
            Some(q) if !q.trim().is_empty() => {
                let needle = q.trim().to_ascii_lowercase();
                symbol.name.to_ascii_lowercase().contains(&needle)
            }
            _ => true,
        })
        .cloned()
        .collect();

    let order = query.order.as_deref().unwrap_or("desc");
    match query.sort.as_deref() {
        Some("name") => {
            items.sort_by(|a, b| a.name.cmp(&b.name));
        }
        _ => {
            items.sort_by(|a, b| a.size.cmp(&b.size));
        }
    }
    if order == "desc" {
        items.reverse();
    }

    let page = query.page.max(1);
    let page_size = query.page_size.max(1);
    let start = (page - 1) * page_size;
    let end = start + page_size;
    let total = items.len();
    let paged = if start >= total {
        Vec::new()
    } else {
        items[start..end.min(total)].to_vec()
    };

    Ok(PagedSymbols { total, items: paged })
}

#[tauri::command]
pub fn lookup_pc(state: tauri::State<'_, AppState>, address: String) -> Result<PcLookupResult, String> {
    let addr_value = parse_pc_address(&address)?;
    let data = state.symbols.lock().map_err(|_| "Failed to read symbols cache.".to_string())?;
    if data.is_empty() {
        return Err("Symbol cache is empty. Run analysis first.".to_string());
    }

    let mut best: Option<(u64, &SymbolInfo)> = None;
    for symbol in data.iter() {
        let addr_str = match symbol.addr.as_ref() {
            Some(value) => value,
            None => continue,
        };
        let start = match parse_hex_str(addr_str) {
            Some(value) => value,
            None => continue,
        };
        if symbol.size == 0 {
            continue;
        }
        let end = start.saturating_add(symbol.size);
        if addr_value >= start && addr_value < end {
            match best {
                Some((best_start, _)) if best_start >= start => {}
                _ => best = Some((start, symbol)),
            }
        }
    }

    let symbol = best.map(|(start, symbol)| PcLookupSymbol {
        name: symbol.name.clone(),
        addr: symbol.addr.clone().unwrap_or_else(|| format!("{:x}", start)),
        size: symbol.size,
        kind: symbol.kind.clone(),
        section_guess: symbol.section_guess.clone(),
        offset: addr_value.saturating_sub(start),
    });

    Ok(PcLookupResult {
        address,
        symbol,
    })
}

fn validate_inputs(params: &AnalyzeParams) -> Result<(), String> {
    if params.elf_path.trim().is_empty() {
        return Err("ELF path is required.".to_string());
    }
    let elf_path = params.elf_path.trim();
    let metadata = fs::metadata(elf_path)
        .map_err(|e| format!("Failed to read ELF file {}: {}", elf_path, e))?;
    if !metadata.is_file() {
        return Err("ELF path must point to a file.".to_string());
    }
    if let Some(map_path) = params.map_path.as_ref() {
        let map_path = map_path.trim();
        if !map_path.is_empty() {
            let metadata = fs::metadata(map_path)
                .map_err(|e| format!("Failed to read MAP file {}: {}", map_path, e))?;
            if !metadata.is_file() {
                return Err("MAP path must point to a file.".to_string());
            }
        }
    }
    Ok(())
}

fn run_command(program: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new(program)
        .args(args)
        .output()
        .map_err(|e| format!("Failed to run {}: {}", program, e))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("{} failed: {}", program, stderr.trim()));
    }
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

fn parse_objdump_sections(output: &str) -> Vec<SectionInfo> {
    output
        .lines()
        .filter_map(|line| {
            let trimmed = line.trim();
            if trimmed.is_empty() || !trimmed.chars().next().map(|c| c.is_ascii_digit()).unwrap_or(false) {
                return None;
            }
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            if parts.len() < 4 {
                return None;
            }
            let name = parts.get(1)?.to_string();
            let size = u64::from_str_radix(parts.get(2)?, 16).ok()?;
            let vma = parts.get(3).map(|v| v.to_string());
            let lma = parts.get(4).map(|v| v.to_string());
            Some(SectionInfo { name, size, vma, lma })
        })
        .collect()
}

fn parse_nm_symbols(output: &str) -> Vec<SymbolInfo> {
    let mut symbols = Vec::new();
    for line in output.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() < 4 {
            continue;
        }
        let addr = parts.get(0).map(|v| v.to_string());
        let size_hex = parts.get(1).unwrap_or(&"");
        let size = u64::from_str_radix(size_hex, 16).unwrap_or(0);
        if size == 0 {
            continue;
        }
        let kind = parts.get(2).unwrap_or(&"?").to_string();
        let name = parts[3..].join(" ");
        let section_guess = guess_section(&kind);
        symbols.push(SymbolInfo {
            name,
            size,
            addr,
            kind,
            section_guess,
        });
    }
    symbols
}

fn compute_section_totals(sections: &[SectionInfo]) -> SectionTotals {
    let mut totals = SectionTotals {
        flash_bytes: 0,
        ram_bytes: 0,
        text_bytes: 0,
        rodata_bytes: 0,
        data_bytes: 0,
        bss_bytes: 0,
        flash_region_bytes: None,
        ram_region_bytes: None,
    };
    for section in sections {
        match section.name.as_str() {
            ".text" => totals.text_bytes += section.size,
            ".rodata" => totals.rodata_bytes += section.size,
            ".data" => totals.data_bytes += section.size,
            ".bss" => totals.bss_bytes += section.size,
            _ => {}
        }
    }
    totals.flash_bytes = totals.text_bytes + totals.rodata_bytes + totals.data_bytes;
    totals.ram_bytes = totals.data_bytes + totals.bss_bytes;
    totals
}

fn guess_section(kind: &str) -> String {
    match kind {
        "T" | "t" => "text",
        "R" | "r" => "rodata",
        "D" | "d" | "G" | "g" | "S" | "s" => "data",
        "B" | "b" => "bss",
        _ => "other",
    }
    .to_string()
}

fn parse_map_contributions(
    map_path: &str,
) -> Result<
    (
        Vec<ObjectContribution>,
        Vec<ObjectContribution>,
        Vec<ObjectContribution>,
        Vec<TreeNode>,
        Vec<MemoryRegion>,
    ),
    String,
> {
    let contents =
        fs::read_to_string(map_path).map_err(|e| format!("Failed to read MAP file {}: {}", map_path, e))?;
    let mut objects: std::collections::HashMap<String, u64> = std::collections::HashMap::new();
    let mut libraries: std::collections::HashMap<String, u64> = std::collections::HashMap::new();
    let mut sections: std::collections::HashMap<String, u64> = std::collections::HashMap::new();
    let mut tree: std::collections::HashMap<String, std::collections::HashMap<String, u64>> =
        std::collections::HashMap::new();
    let memory_regions = parse_memory_regions(&contents);

    for line in contents.lines() {
        let trimmed = line.trim_start();
        if trimmed.starts_with(".") {
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            if parts.len() < 4 {
                continue;
            }
            let section_name = parts.get(0).unwrap_or(&"");
            let size_hex = parts.get(2).unwrap_or(&"");
            let size = u64::from_str_radix(size_hex.trim_start_matches("0x"), 16).unwrap_or(0);
            if size == 0 {
                continue;
            }
            let file = parts.last().unwrap_or(&"");
            if file.starts_with('*') || file == &"*fill*" || file == &"*(COMMON)" {
                continue;
            }
            if !file.contains(".o") && !file.contains(".a") {
                continue;
            }
            let object_entry = objects.entry((*file).to_string()).or_insert(0);
            *object_entry += size;

            if let Some(library_name) = extract_library_name(file) {
                let lib_entry = libraries.entry(library_name).or_insert(0);
                *lib_entry += size;
            }

            let section_entry = sections.entry((*section_name).to_string()).or_insert(0);
            *section_entry += size;

            let (library_name, object_name) = split_library_object(file);
            let library_label = library_name.unwrap_or_else(|| "Objects".to_string());
            let lib_entry = tree.entry(library_label).or_default();
            let obj_entry = lib_entry.entry(object_name).or_insert(0);
            *obj_entry += size;
        }
    }

    let top_objects = top_contributions(objects, 20);
    let top_libraries = top_contributions(libraries, 12);
    let top_sections = top_contributions(sections, 8);
    let map_tree = build_tree(tree, 20, 40);

    Ok((top_objects, top_libraries, top_sections, map_tree, memory_regions))
}

fn top_contributions(map: std::collections::HashMap<String, u64>, limit: usize) -> Vec<ObjectContribution> {
    let mut result: Vec<ObjectContribution> = map
        .into_iter()
        .map(|(name, size)| ObjectContribution { name, size })
        .collect();
    result.sort_by(|a, b| b.size.cmp(&a.size));
    if result.len() > limit {
        result.truncate(limit);
    }
    result
}

fn extract_library_name(path: &str) -> Option<String> {
    if let Some(start) = path.find('(') {
        if let Some(end) = path[start + 1..].find(')') {
            let lib_path = &path[..start];
            if lib_path.contains(".a") {
                let name = lib_path.split(|c| c == '/' || c == '\\').last().unwrap_or(lib_path);
                return Some(name.to_string());
            }
            let inner = &path[start + 1..start + 1 + end];
            if inner.contains(".a") {
                return Some(inner.to_string());
            }
        }
    }
    if path.contains(".a") && path.contains("/") {
        let name = path.split(|c| c == '/' || c == '\\').last().unwrap_or(path);
        return Some(name.to_string());
    }
    None
}

fn split_library_object(path: &str) -> (Option<String>, String) {
    if let Some(start) = path.find('(') {
        if let Some(end) = path[start + 1..].find(')') {
            let lib_path = &path[..start];
            let obj_name = &path[start + 1..start + 1 + end];
            let lib_name = lib_path
                .split(|c| c == '/' || c == '\\')
                .last()
                .unwrap_or(lib_path)
                .to_string();
            return (Some(lib_name), obj_name.to_string());
        }
    }
    let base = path
        .split(|c| c == '/' || c == '\\')
        .last()
        .unwrap_or(path)
        .to_string();
    (None, base)
}

fn build_tree(
    tree: std::collections::HashMap<String, std::collections::HashMap<String, u64>>,
    lib_limit: usize,
    obj_limit: usize,
) -> Vec<TreeNode> {
    let mut libs: Vec<TreeNode> = tree
        .into_iter()
        .map(|(lib, objects)| {
            let mut children: Vec<TreeNode> = objects
                .into_iter()
                .map(|(name, size)| TreeNode {
                    name,
                    size,
                    children: Vec::new(),
                })
                .collect();
            children.sort_by(|a, b| b.size.cmp(&a.size));
            if children.len() > obj_limit {
                children.truncate(obj_limit);
            }
            let size = children.iter().map(|child| child.size).sum();
            TreeNode {
                name: lib,
                size,
                children,
            }
        })
        .collect();
    libs.sort_by(|a, b| b.size.cmp(&a.size));
    if libs.len() > lib_limit {
        libs.truncate(lib_limit);
    }
    libs
}

fn parse_memory_regions(contents: &str) -> Vec<MemoryRegion> {
    let mut regions = Vec::new();
    let mut in_section = false;
    let mut header_seen = false;
    let mut has_used = false;

    for line in contents.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("Memory Configuration") {
            in_section = true;
            continue;
        }
        if in_section && trimmed.starts_with("Name") {
            header_seen = true;
            has_used = trimmed.to_ascii_lowercase().contains("used");
            continue;
        }
        if in_section && header_seen {
            if trimmed.is_empty() {
                break;
            }
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            if parts.len() < 3 {
                continue;
            }
            let name = parts[0].to_string();
            let origin = parts[1].to_string();
            let length = parse_hex_or_dec(parts[2]);
            let used = if has_used { find_used_value(&parts) } else { None };
            if name.to_ascii_lowercase() == "default" && used.unwrap_or(0) == 0 {
                continue;
            }
            regions.push(MemoryRegion {
                name,
                origin,
                length,
                used,
            });
        }
    }

    regions
}

fn find_used_value(parts: &[&str]) -> Option<u64> {
    for part in parts.iter().rev() {
        if let Some(value) = parse_optional_number(part) {
            return Some(value);
        }
    }
    None
}

fn parse_optional_number(value: &str) -> Option<u64> {
    if let Some(hex) = value.strip_prefix("0x") {
        return u64::from_str_radix(hex, 16).ok();
    }
    value.parse::<u64>().ok()
}

fn apply_region_totals(mut totals: SectionTotals, regions: &[MemoryRegion]) -> SectionTotals {
    if regions.is_empty() {
        return totals;
    }
    let mut flash_used = None;
    let mut ram_used = None;
    for region in regions {
        let used = match region.used {
            Some(value) => value,
            None => continue,
        };
        let name = region.name.to_ascii_lowercase();
        if name.contains("flash") || name.contains("rom") {
            flash_used = Some(flash_used.unwrap_or(0) + used);
        }
        if name.contains("ram") || name.contains("sram") {
            ram_used = Some(ram_used.unwrap_or(0) + used);
        }
    }
    totals.flash_region_bytes = flash_used;
    totals.ram_region_bytes = ram_used;
    totals
}

fn compute_findings(
    symbols: &mut Vec<SymbolInfo>,
    sections: &[SectionInfo],
    strings_count: Option<u64>,
) -> Vec<Finding> {
    let mut findings = Vec::new();
    let mut ram_symbols: Vec<&SymbolInfo> = symbols
        .iter()
        .filter(|s| matches!(s.kind.as_str(), "B" | "b" | "D" | "d"))
        .collect();
    ram_symbols.sort_by(|a, b| b.size.cmp(&a.size));
    let ram_total: u64 = ram_symbols.iter().map(|s| s.size).sum();
    if ram_total > 0 {
        findings.push(Finding {
            id: "RAM_PRESSURE".to_string(),
            severity: "warn".to_string(),
            value: ram_total,
            items: ram_symbols.iter().take(5).map(|s| s.name.clone()).collect(),
        });
    }

    let mut float_symbols: Vec<&SymbolInfo> = symbols
        .iter()
        .filter(|s| {
            let name = s.name.to_ascii_lowercase();
            name.contains("float")
                || name.contains("dtoa")
                || name.contains("aeabi_f")
                || name.contains("aeabi_d")
        })
        .collect();
    float_symbols.sort_by(|a, b| b.size.cmp(&a.size));
    let float_total: u64 = float_symbols.iter().map(|s| s.size).sum();
    if float_total > 0 {
        findings.push(Finding {
            id: "FLOAT_BLOAT".to_string(),
            severity: "warn".to_string(),
            value: float_total,
            items: float_symbols.iter().take(5).map(|s| s.name.clone()).collect(),
        });
    }

    let exidx_total: u64 = sections
        .iter()
        .filter(|s| s.name.contains(".ARM.exidx") || s.name.contains(".ARM.extab"))
        .map(|s| s.size)
        .sum();
    if exidx_total > 0 {
        findings.push(Finding {
            id: "EXIDX".to_string(),
            severity: "info".to_string(),
            value: exidx_total,
            items: sections
                .iter()
                .filter(|s| s.name.contains(".ARM.exidx") || s.name.contains(".ARM.extab"))
                .map(|s| s.name.clone())
                .collect(),
        });
    }

    if let Some(count) = strings_count {
        if count > 0 {
            findings.push(Finding {
                id: "STRING_COUNT".to_string(),
                severity: "info".to_string(),
                value: count,
                items: Vec::new(),
            });
        }
    }

    findings
}

fn count_strings_lines(program: &str, elf_path: &str) -> Result<u64, String> {
    let mut child = std::process::Command::new(program)
        .args([elf_path])
        .stdout(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to run {}: {}", program, e))?;

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Failed to capture strings output.".to_string())?;
    let mut count: u64 = 0;
    let mut reader = std::io::BufReader::new(stdout);
    let mut buf = Vec::with_capacity(8192);
    while reader.read_until(b'\n', &mut buf).map_err(|e| e.to_string())? > 0 {
        count += 1;
        buf.clear();
    }
    let status = child.wait().map_err(|e| e.to_string())?;
    if !status.success() {
        return Err("strings command failed".to_string());
    }
    Ok(count)
}

fn build_cache_key(toolchain: &ToolchainPaths, params: &AnalyzeParams) -> Result<String, String> {
    let cache_version = "v3";
    let elf_hash = hash_file(&params.elf_path)?;
    let map_hash = match params.map_path.as_ref().map(|p| p.trim()).filter(|p| !p.is_empty()) {
        Some(path) => hash_file(path)?,
        None => String::from("none"),
    };
    let tool_sig = format!("{}|{}|{}", toolchain.nm_path, toolchain.objdump_path, toolchain.strings_path);
    let raw = format!("ver:{}|elf:{}|map:{}|tool:{}", cache_version, elf_hash, map_hash, tool_sig);
    Ok(hash_string(&raw))
}

fn cache_dir(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let base_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to resolve app config dir: {}", e))?;
    Ok(base_dir.join("cache"))
}

fn cache_file_path(app: &tauri::AppHandle, key: &str, suffix: &str) -> Result<std::path::PathBuf, String> {
    let dir = cache_dir(app)?;
    Ok(dir.join(format!("{}-{}.json", suffix, key)))
}

fn load_cached_result(app: &tauri::AppHandle, key: &str) -> Result<Option<AnalysisResult>, String> {
    let path = cache_file_path(app, key, "analysis")?;
    if !path.exists() {
        return Ok(None);
    }
    let contents = fs::read_to_string(&path).map_err(|e| format!("Failed to read cache: {}", e))?;
    let result = serde_json::from_str::<AnalysisResult>(&contents)
        .map_err(|e| format!("Failed to parse cache: {}", e))?;
    Ok(Some(result))
}

fn load_cached_symbols(app: &tauri::AppHandle, key: &str) -> Result<Option<Vec<SymbolInfo>>, String> {
    let path = cache_file_path(app, key, "symbols")?;
    if !path.exists() {
        return Ok(None);
    }
    let contents = fs::read_to_string(&path).map_err(|e| format!("Failed to read cache: {}", e))?;
    let result = serde_json::from_str::<Vec<SymbolInfo>>(&contents)
        .map_err(|e| format!("Failed to parse cache: {}", e))?;
    Ok(Some(result))
}

fn store_cached_result(app: &tauri::AppHandle, key: &str, result: &AnalysisResult) -> Result<(), String> {
    let path = cache_file_path(app, key, "analysis")?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create cache dir: {}", e))?;
    }
    let json = serde_json::to_string(result).map_err(|e| format!("Failed to serialize cache: {}", e))?;
    write_atomic(&path, json.as_bytes())?;
    Ok(())
}

fn store_cached_symbols(app: &tauri::AppHandle, key: &str, symbols: &[SymbolInfo]) -> Result<(), String> {
    let path = cache_file_path(app, key, "symbols")?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create cache dir: {}", e))?;
    }
    let json = serde_json::to_string(symbols).map_err(|e| format!("Failed to serialize cache: {}", e))?;
    write_atomic(&path, json.as_bytes())?;
    Ok(())
}

fn hash_file(path: &str) -> Result<String, String> {
    let mut file = fs::File::open(path).map_err(|e| format!("Failed to open {}: {}", path, e))?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 8192];
    loop {
        let read = file.read(&mut buf).map_err(|e| e.to_string())?;
        if read == 0 {
            break;
        }
        hasher.update(&buf[..read]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn hash_string(value: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(value.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn parse_hex_or_dec(value: &str) -> u64 {
    if let Some(hex) = value.strip_prefix("0x") {
        u64::from_str_radix(hex, 16).unwrap_or(0)
    } else {
        value.parse::<u64>().unwrap_or(0)
    }
}

fn parse_pc_address(value: &str) -> Result<u64, String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err("Address is required.".to_string());
    }
    let lowered = trimmed.to_ascii_lowercase();
    let (radix, digits) = if let Some(rest) = lowered.strip_prefix("0x") {
        (16, rest)
    } else if lowered.chars().any(|c| matches!(c, 'a'..='f')) {
        (16, lowered.as_str())
    } else {
        (10, trimmed)
    };
    if digits.is_empty() {
        return Err("Invalid address.".to_string());
    }
    u64::from_str_radix(digits, radix).map_err(|_| "Invalid address.".to_string())
}

fn parse_hex_str(value: &str) -> Option<u64> {
    let trimmed = value.trim();
    let digits = trimmed.strip_prefix("0x").unwrap_or(trimmed);
    u64::from_str_radix(digits, 16).ok()
}
