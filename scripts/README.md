# scripts/

| Script | Dónde corre | Qué hace |
|---|---|---|
| `bootstrap.sh` | laptop | instala deps y verifica entorno |
| `check.sh` | laptop / base del CI | `build` + `svelte-check` |
| `build-all.sh` | laptop | check + `cap sync` |
| `package-web.sh [dir]` | laptop / CI | zip web en `release/` (ignorado en git) |
| `release.sh` | laptop | bump patch + check + package (no pushea) |
