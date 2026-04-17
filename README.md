# MealVote

去中心化群組投票點餐系統，整合會員登入、訂閱開通、群組管理、店家投票、點餐流程、商家工作台與平台後台。

## 功能概覽

- MetaMask 錢包簽名登入
- 會員訂閱開通與優惠券 / 票券紀錄
- 群組建立、邀請碼加入、群組使用紀錄
- 建立訂單、提案店家、投票、點餐、送單追蹤
- 店家端菜單、評論、訂單與營運資料
- 管理端治理參數、撥款與審核流程

## 技術棧

- Frontend: Next.js 15、React 18、Tailwind CSS、shadcn/ui
- Backend: Go、Gin
- Database: PostgreSQL
- Web3: wagmi、viem
- Smart Contracts: Solidity、Foundry、Hardhat
- Network: Sepolia (`11155111`)

## 專案結構

- `apps/web`: 主線前端
- `backend`: API、資料庫存取、鏈上同步、排程
- `contract`: Solidity 合約
- `script`: Foundry 部署腳本
- `scripts`: 合約設定同步腳本


## Docker 開發

目前建議的日常開發方式是直接用 Docker Compose。

### 啟動

在 repo 根目錄：

```bash
docker compose up --build -d
```

服務預設會啟動在：

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8080](http://localhost:8080)
- PostgreSQL: `localhost:5432`

### 前端重建

當你修改 `apps/web` 後想強制重建前端容器：

```bash
docker compose up --build --force-recreate -d frontend
```

### 查看狀態與 log

```bash
docker compose ps
docker logs --tail=80 mealvote-frontend
docker logs --tail=80 mealvote-backend
```

### Docker 設定說明

- `compose.yaml` 的 `frontend` 服務使用 `apps/web/Dockerfile.dev`
- `apps/web/Dockerfile.dev` 使用 `npm ci`
- 前端容器已啟用 `CHOKIDAR_USEPOLLING=true` 與 `WATCHPACK_POLLING=true`，讓 Docker 內熱更新更穩定
- `backend` 服務會讀取 `backend/.env.deployment`

## 本機非 Docker 開發

### 1. 啟動 PostgreSQL

```bash
docker compose up -d postgres
```

### 2. 啟動後端

```bash
cd backend
DATABASE_URL='postgres://mealvote:mealvote@localhost:5432/mealvote?sslmode=disable' \
DB_AUTOMIGRATE=true \
go run .
```

後端預設網址：`http://localhost:8080`

### 3. 啟動前端

在 repo 根目錄：

```bash
npm run web:install
npm run web:dev
```

前端預設網址：`http://localhost:3000`

## Production Docker Build

### Frontend

`apps/web/Dockerfile` 為 production image，使用 Next standalone output。

```bash
docker build -t mealvote-web ./apps/web
docker run --rm -p 3000:3000 mealvote-web
```

### Backend

```bash
docker build -t mealvote-api ./backend
docker run --rm -p 8080:8080 \
  -e HTTP_ADDR=:8080 \
  -e DATABASE_URL='postgres://mealvote:mealvote@host.docker.internal:5432/mealvote?sslmode=disable' \
  mealvote-api
```

## 常用指令

在 repo 根目錄：

```bash
npm run web:install
npm run web:dev
npm run web:build
npm run web:start
npm run compile
npm run test:contracts
npm run deploy:sepolia
npm run export:contracts
```

## 主要路由

- `/`: 目前會導向 `/member`
- `/login`: 使用者 / 店家 / 平台管理者登入入口
- `/subscribe`: 會員訂閱開通頁
- `/member`: 會員首頁，需已登入且已訂閱
- `/member/groups`: 群組總覽
- `/member/merchants`: 店家清單
- `/member/invite-codes`: 註冊邀請碼與使用紀錄
- `/member/records`: 使用紀錄
- `/member/badges`: 勳章兌換
- `/member/ordering/*`: 建單、提案、投票、點餐、已送出訂單
- `/merchant`: 店家工作台
- `/admin`: 管理後台

## 登入與訂閱流程

- 未登入使用者進入受保護頁面時，會被導向 `/login`
- 會員登入成功但尚未訂閱時，會被導向 `/subscribe`
- `/member` 目前維持「已登入且已訂閱」才能進入
- `/subscribe` 的 `離開` 會清除目前登入狀態並回到 `/login`

## 環境變數

### Backend

常用：

- `HTTP_ADDR`
- `DATABASE_URL`
- `DB_AUTOMIGRATE`
- `SYNC_ON_START`
- `CHAIN_ID`
- `RPC_URL`
- `GOVERNANCE_CONTRACT_ADDRESS`
- `ORDER_ESCROW_CONTRACT_ADDRESS`
- `ORDER_CONTRACT_ADDRESS`
- `PLATFORM_TREASURY_ADDRESS`
- `MEMBERSHIP_TOKEN_ADDRESS`
- `SIGNER_PRIVATE_KEY`

Rate limit / 排程相關：

- `RATE_LIMIT_LOGIN_MAX`
- `RATE_LIMIT_LOGIN_WINDOW_SEC`
- `RATE_LIMIT_REGISTER_MAX`
- `RATE_LIMIT_REGISTER_WINDOW_SEC`
- `RATE_LIMIT_WALLET_LINK_MAX`
- `RATE_LIMIT_WALLET_LINK_WINDOW_SEC`
- `INACTIVE_GROUP_PRUNE_INTERVAL_MIN`
- `INACTIVE_GROUP_THRESHOLD_DAYS`
- `ORDER_SIGNATURE_EXPIRY_SEC`
- `INDEXER_BATCH_SIZE`

### Frontend

- `NEXT_PUBLIC_API_BASE`
- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_ORDER_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS`

## 合約部署

```bash
export SEPOLIA_RPC_URL="..."
export DEPLOYER_PRIVATE_KEY="..."
export PLATFORM_MAIN_WALLET="0x..."
export BACKEND_SIGNER_ADDRESS="0x..."

npm run deploy:sepolia
npm run export:contracts
```

## 備註

- `apps/web` 才是目前主線前端
- `apps/web/Dockerfile` 用於 production build
- `apps/web/Dockerfile.dev` 用於本地 Docker 開發
