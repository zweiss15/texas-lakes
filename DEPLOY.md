# Deploying texas-lakes to the VPS

Same shape as `medina-lake`: fully static, root login, `/var/www/` path, no
pm2/systemd since there's no persistent process — just files nginx serves,
plus a daily cron job that re-runs `scripts/fetch-data.mjs` to refresh every
lake's data and regenerate each lake's page.

## One-time setup

SSH in as root, then:

```bash
git clone https://github.com/<your-username>/texas-lakes.git /var/www/texas-lakes
cd /var/www/texas-lakes
node --version   # should be 18+
node scripts/fetch-data.mjs   # confirms it works; the repo already has fresh data committed
```

## DNS

Suggested subdomain, matching the `medina.internetsloth.com` pattern:
**`texaslakes.internetsloth.com`**. In Namecheap, add an A record:
Host `texaslakes`, Value `129.212.179.117`. Swap this section if you'd
rather use a different name — nothing in the app is hardcoded to it.

## nginx

```bash
cat > /etc/nginx/sites-available/texas-lakes << 'EOF'
server {
    listen 80;
    server_name texaslakes.internetsloth.com;

    root /var/www/texas-lakes;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ ^/data/.*\.json$ {
        add_header Cache-Control "no-cache";
    }
}
EOF

ln -s /etc/nginx/sites-available/texas-lakes /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

Then TLS:

```bash
certbot --nginx -d texaslakes.internetsloth.com
```

## Daily data refresh (cron)

```bash
crontab -e
```

Add (alongside the existing `speedtest` and `medina-lake` lines):

```cron
0 9 * * * cd /var/www/texas-lakes && /usr/bin/node scripts/fetch-data.mjs >> /var/log/texas-lakes-fetch.log 2>&1
```

One run refreshes all 39 lakes and regenerates every lake page plus the
directory — no per-lake cron entries needed.

## Updating the site later (new commits)

```bash
cd /var/www/texas-lakes
git fetch origin
git reset --hard origin/main
```
