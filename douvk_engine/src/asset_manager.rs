pub struct AssetManager{
    assets: HashMap<Path, AssetBase>
}

impl AssetManager{

    pub fn new()->Self{
        Self{ 
            assets:HashMap::new()
        }
    }

    pub fn get_asset(&mut self, path:Path) -> Result{

        if !self.assets.contains_key(&path) {
            println!("Loading Asset {}", path);
            let asset = Asset::new(format);
            self.assets.insert(asset_name.clone(), asset);
        }

    }

 
}