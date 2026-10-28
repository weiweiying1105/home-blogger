#!/usr/bin/env bash
# 服务器上更新部署：git pull -> 重新构建 -> 平滑重启
set -euo pipefail
cd /opt/home-blogger
git pull
npm ci
npm run build
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
pm2 restart home-blogger --update-env
echo "部署完成：$(pm2 list | grep home-blogger)"
