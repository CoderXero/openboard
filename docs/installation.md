# OpenBoard installation

## Debian/Ubuntu

From the directory containing the package:

```bash
sudo apt install --reinstall ./OpenBoard-0.1.0-amd64.deb
```

Verify the Electron sandbox helper:

```bash
stat -c '%A %a %U:%G %n' /opt/OpenBoard/chrome-sandbox
```

It must be owned by root and have setuid mode `4755`:

```text
-rwsr-xr-x 4755 root:root /opt/OpenBoard/chrome-sandbox
```

If `ELECTRON_RUN_AS_NODE` or `ELECTRON_NO_ATTACH_CONSOLE` is present in the environment, start the application with:

```bash
env -u ELECTRON_RUN_AS_NODE -u ELECTRON_NO_ATTACH_CONSOLE openboard --disable-gpu
```

Remove those variables from the shell profile if this workaround is needed permanently.

## AppImage

```bash
chmod +x OpenBoard-0.1.0-x86_64.AppImage
env -u ELECTRON_RUN_AS_NODE -u ELECTRON_NO_ATTACH_CONSOLE ./OpenBoard-0.1.0-x86_64.AppImage --disable-gpu
```
