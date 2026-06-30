# jasperjapp SSH easter egg

Visitors run:
```
ssh guest@ssh.jasperjapp.com
```

The main site is on GitHub Pages (jasperjapp.com), so the SSH server runs
as a separate service on a subdomain. GitHub Pages handles web traffic;
Fly.io handles SSH — DNS keeps them apart.

---

## Local setup

```bash
cd ssh-server
npm install
npm run keygen        # generates ./host_key (only needed once)
PORT=2222 node server.mjs
```

Test it:
```bash
ssh -p 2222 guest@localhost
```

Accept the host key fingerprint when prompted — that's expected for a new server.

---

## Deploy to Fly.io

**1. Install flyctl**
```
https://fly.io/docs/hands-on/install-flyctl/
```

**2. Log in and create the app**
```bash
cd ssh-server
fly auth login
fly launch --no-deploy
# when prompted: name = jasperjapp-ssh, region = syd, no postgres, no redis
```

**3. Set the host key secret**
```bash
# macOS
base64 host_key | fly secrets set HOST_KEY=-

# Linux
base64 -w 0 host_key | fly secrets set HOST_KEY=-

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("host_key")) | fly secrets set HOST_KEY=-
```

**4. Deploy**
```bash
fly deploy
```

**5. Get the IP**
```bash
fly ips allocate-v4   # allocate a dedicated IPv4 (needed for port 22)
fly ips list          # shows the IPv4 address
```

**6. Add DNS record**

In your domain registrar (wherever jasperjapp.com DNS is managed — likely
Squarespace, Namecheap, Cloudflare, etc.):

| Type | Name | Value                  | TTL  |
|------|------|------------------------|------|
| A    | ssh  | <Fly IPv4 from step 5> | 3600 |

This creates `ssh.jasperjapp.com` → Fly.io without touching the existing
records that point `jasperjapp.com` to GitHub Pages.

**7. Test**
```bash
ssh guest@ssh.jasperjapp.com
```

---

## Keeping the host key stable

Once deployed, don't regenerate host_key — SSH clients will warn users if the
key changes (looks like a MITM attack). The key is stored as a Fly secret, so
it survives redeploys automatically.

---

## Hinting at it on the site

The 404 page is a natural place for a subtle hint — people who find it are
already exploring. There's already a note in 404.astro you can extend.
