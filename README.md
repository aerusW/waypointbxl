# Waypoint — Deploy guide

Static site. No build step. Drop files, push, done.

---

## GitHub Pages

### First deploy

1. Create a new **public** repository on GitHub (e.g. `waypointbxl/waypointbxl.github.io` or any name).
2. Push this folder to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial deploy"
   git remote add origin https://github.com/YOUR-ORG/YOUR-REPO.git
   git push -u origin main
   ```
3. In the repo → **Settings → Pages**:
   - Source: `Deploy from a branch`
   - Branch: `main` / `/ (root)`
   - Click **Save**.
4. GitHub will publish within ~60 seconds. The temporary URL is `https://YOUR-ORG.github.io/YOUR-REPO/`.

### Point waypointbxl.be at GitHub Pages

1. In **Settings → Pages → Custom domain**, enter `waypointbxl.be` and click Save.
   (The `CNAME` file is already in the repo, so this is automatic on next push.)
2. At your DNS registrar, add these records:

   | Type  | Host | Value |
   |-------|------|-------|
   | A     | @    | 185.199.108.153 |
   | A     | @    | 185.199.109.153 |
   | A     | @    | 185.199.110.153 |
   | A     | @    | 185.199.111.153 |
   | CNAME | www  | YOUR-ORG.github.io |

3. Back in Settings → Pages, tick **Enforce HTTPS** once the certificate is issued (can take up to 24 h after DNS propagates).

### Updates

Just `git push`. Pages redeploys automatically.

---

## Netlify

### First deploy (drag-and-drop — fastest)

1. Go to [app.netlify.com](https://app.netlify.com) and log in.
2. Drag the entire `waypoint/` folder onto the deploy dropzone on the dashboard.
3. Done — Netlify gives you a random `*.netlify.app` URL immediately.

### First deploy (Git-connected — recommended for ongoing use)

1. Push this folder to a GitHub/GitLab/Bitbucket repo (same steps as above).
2. In Netlify → **Add new site → Import an existing project** → connect the repo.
3. Build settings: leave **Build command** and **Publish directory** blank (or set publish dir to `.`). No build step needed.
4. Click **Deploy site**.

### Point waypointbxl.be at Netlify

1. In Netlify → **Site configuration → Domain management → Add a domain**, enter `waypointbxl.be`.
2. Netlify shows you its load-balancer IP. At your DNS registrar:

   | Type  | Host | Value |
   |-------|------|-------|
   | A     | @    | 75.2.60.5 *(check Netlify dashboard — IP may differ)* |
   | CNAME | www  | YOUR-SITE-NAME.netlify.app |

3. Back in Netlify → Domain management, click **Verify DNS configuration**.
4. Netlify provisions an SSL certificate automatically via Let's Encrypt (usually within minutes).

> **Note:** the `CNAME` file in the repo root is only read by GitHub Pages. Netlify ignores it — domain config lives in the Netlify dashboard.

### Updates

If connected to Git, every push to `main` triggers a redeploy automatically.

---

## Local preview

No server needed — just open `index.html` in a browser.

For smooth-scroll and font loading to work as in production, serve it locally:

```bash
# Python 3
python -m http.server 8080
# then open http://localhost:8080
```
