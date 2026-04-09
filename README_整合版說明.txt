這是完整的 blowbranch 主體整合版本，已包含你負責的測試版功能：

1. 會員首頁積分卡片可進入個人勳章頁
2. 會員名稱下方顯示勳章稱號
3. 店家列表卡片加入建築物與店家勳章
4. 店家詳細頁加入建築詳細資訊、分類評論、星等、評論內容、新增菜單
5. 個人勳章頁可用積分兌換勳章稱號並查看紀錄
6. 群組頁會員清單區塊加入成就排行榜按鈕
7. backend/.env.deployment 已補上，方便 Docker 測試

如果要啟動：
1. cd 到專案根目錄
2. docker compose up --build
3. 若 backend 因 postgres 尚未 ready 先退出，再執行 docker compose up -d backend
