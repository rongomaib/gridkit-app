use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;
use toml::{de::Error as TomlDeError, ser::Error as TomlSerError};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_workspaces,
            add_workspace,
            remove_workspace,
            list_products,
            get_product_meta,
            get_product_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Debug, thiserror::Error)]
enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("failed to parse toml")]
    ParseToml(#[source] TomlDeError),
    #[error("failed to display toml")]
    DisplayToml(#[source] TomlSerError),
    #[error("could not resolve app dir")]
    NoAppDir,
    #[error("invalid product file path: {path}")]
    InvalidProductPath { path: PathBuf },
}

impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct WorkspaceConfig {
    path: PathBuf,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct AppConfig {
    workspaces: Vec<WorkspaceConfig>,
}

async fn get_app_config_path(app_handle: tauri::AppHandle) -> Result<PathBuf> {
    let app_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|_| Error::NoAppDir)?;
    if !tokio::fs::try_exists(app_dir.clone()).await? {
        tokio::fs::create_dir_all(app_dir.clone()).await?;
    }
    let app_config_path = app_dir.join("config.toml");
    Ok(app_config_path)
}

async fn load_app_config(app_handle: tauri::AppHandle) -> Result<AppConfig> {
    let app_config_path = get_app_config_path(app_handle).await?;
    if tokio::fs::try_exists(app_config_path.clone()).await? {
        let app_config_string = tokio::fs::read_to_string(app_config_path).await?;
        let app_config = toml::from_str(&app_config_string).map_err(Error::ParseToml)?;
        Ok(app_config)
    } else {
        Ok(AppConfig::default())
    }
}

async fn save_app_config(app_handle: tauri::AppHandle, app_config: AppConfig) -> Result<()> {
    let app_config_path = get_app_config_path(app_handle).await?;
    let config_string = toml::to_string_pretty(&app_config).map_err(Error::DisplayToml)?;
    tokio::fs::write(app_config_path, config_string).await?;
    Ok(())
}

#[tauri::command]
async fn list_workspaces(app_handle: tauri::AppHandle) -> Result<Vec<WorkspaceConfig>> {
    let config = load_app_config(app_handle).await?;

    Ok(config.workspaces)
}

#[tauri::command]
async fn add_workspace(app_handle: tauri::AppHandle, workspace: WorkspaceConfig) -> Result<()> {
    let mut app_config = load_app_config(app_handle.clone()).await?;
    app_config.workspaces.push(workspace);
    save_app_config(app_handle, app_config).await?;
    Ok(())
}

#[tauri::command]
async fn remove_workspace(app_handle: tauri::AppHandle, workspace_path: PathBuf) -> Result<()> {
    let mut app_config = load_app_config(app_handle.clone()).await?;
    app_config
        .workspaces
        .retain(|workspace| workspace.path != workspace_path);
    save_app_config(app_handle, app_config).await?;
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ProductIndex {
    path: PathBuf,
    id: String,
}

#[tauri::command]
async fn list_products(workspace_path: PathBuf) -> Result<Vec<ProductIndex>> {
    let workspace_products_path = workspace_path.join("products");
    let mut dir_reader = tokio::fs::read_dir(workspace_products_path).await?;
    let mut products = Vec::new();
    loop {
        let Some(next_dir_entry) = dir_reader.next_entry().await? else {
            break;
        };
        let product_path = next_dir_entry.path();
        let product_id = product_path
            .clone()
            .file_name()
            .and_then(|file_name| file_name.to_str())
            .ok_or_else(|| Error::InvalidProductPath {
                path: product_path.clone(),
            })?
            .to_string();
        products.push(ProductIndex {
            path: product_path,
            id: product_id,
        })
    }

    Ok(products)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
enum ProductType {
    Kit,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ProductExports(String);

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ProductMeta {
    name: String,
    label: String,
    #[serde(default)]
    description: Option<String>,
    tags: Vec<String>,
    #[serde(rename = "type")]
    typ: ProductType,
    exports: ProductExports,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ProductMetaFile {
    product: ProductMeta,
}

#[tauri::command]
async fn get_product_meta(product_path: PathBuf) -> Result<ProductMeta> {
    let product_meta_path = product_path.join("villagekit.toml");
    let product_meta_string = tokio::fs::read_to_string(product_meta_path).await?;
    let product_meta: ProductMetaFile =
        toml::from_str(&product_meta_string).map_err(Error::ParseToml)?;
    Ok(product_meta.product)
}

#[tauri::command]
async fn get_product_file(product_path: PathBuf, file_name: &str) -> Result<String> {
    let product_file_path = product_path.join(file_name);
    let product_file = tokio::fs::read_to_string(product_file_path).await?;
    Ok(product_file)
}
