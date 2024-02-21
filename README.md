# mp-builder

### Usage

```js
import Builder from "mp-builder";

const builder = new Builder({
  appid: "appid",
  privateKeyPath: "path/to/privateKeyPath",
  projectPath: ".",
});

builder.preview(); // preview
builder.upload(); // upload
```

```bash
mp-builder -v 1.1.1 -c "path/to/custom_config_path"
```
