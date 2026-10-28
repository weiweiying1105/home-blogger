#!/usr/bin/env bash
# Home Blogger 服务器首次初始化脚本
# 前提：全新 Ubuntu 24.04，root 登录，本机公钥已加入 authorized_keys
# 用法（在服务器上）：bash deploy/setup.sh
set -euo pipefail

echo "==> 安装基础软件（nodejs 22 / caddy / pm2 / git）"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get update
apt-get install -y nodejs git caddy

npm install -g pm2

echo "==> 配置 2G swap（防止 next build 内存不足）"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> 拉取代码"
mkdir -p /opt
if [ ! -d /opt/home-blogger ]; then
  git clone https://github.com/weiweiying1105/home-blogger.git /opt/home-blogger
fi
cd /opt/home-blogger

echo "==> 安装依赖并构建（.env 需事先放好）"
test -f .env || { echo "错误：缺少 /opt/home-blogger/.env，先写入环境变量再重跑"; exit 1; }
npm ci
npm run build

echo "==> 整理 standalone 产物"
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "==> pm2 启动并设置开机自启"
pm2 delete home-blogger 2>/dev/null || true
PORT=3000 HOSTNAME=0.0.0.0 pm2 start .next/standalone/server.js --name home-blogger
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

echo "==> 配置 Caddy（自动 HTTPS）"
cp deploy/Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy

echo "==> 完成。验证：curl -I http://127.0.0.1:3000"
