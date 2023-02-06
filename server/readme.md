# The Server

```
cargo run
```

### Auto Types

Message types are automatically generated using the ts-rs create. In order to generate these types run ```cargo test```. These types are collected into ```/server/bindings/```. To collect these types into a single index file which can be imported there is a build script which is currently commented out in the cargo.toml.