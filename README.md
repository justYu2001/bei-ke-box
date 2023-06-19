# 北科盒子

北科 111 學年度智能合約撰寫期末專案

  - [測試帳號](#測試帳號)
  - [運行專案](#運行專案)
  - [匯入錢包](#匯入錢包)

## 測試帳號

提供以下兩個假帳號做功能測試
> :warning: 請注意：以下帳戶的地址與私鑰都是公開的，所以請不要將其他網路的加密貨幣轉帳到以下帳號

### 第一個帳號

已和北科學生 Google 帳號 t109590011@ntut.org.tw 綁定，可以用賣家的身分使用上傳筆記的功能

錢包帳戶私鑰：
```
0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

### 第二個帳號

錢包帳戶私鑰：
```
0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897
```

您需要先將測試帳號的私鑰匯入 MetaMask 才能使用測試帳號登入（[如何匯入錢包](#匯入錢包)）

## 運行專案

1. 運行本專案會需要使用 [Docker](https://www.docker.com/)，若您的電腦沒有 Docker，請先進行[安裝](https://docs.docker.com/get-docker/)

2. clone 本專案
```bash
git clone https://github.com/justYu2001/bei-ke-box.git
```

3. 下載測試用資料
   
透過此 Google 雲端硬碟[連結](https://drive.google.com/file/d/1LTaJfr5AH7GpgyzYTg8Kf3ik6QGitzVU/view?usp=sharing)下載測試資料，將下載下來的資料解壓縮後會看到兩個資料夾，`db` 和  `abi`，請將這兩個資料夾直接放在專案的資料夾底下

```
.
├─ db
├─ abi
├─ public
│  └─ favicon.ico
├─ prisma
│  └─ schema.prisma
├─ src
...
```

4. 進入專案資料夾

```bash
cd bei-ke-box
```

5. 建立並運行 docker compose（第一次執行大概會需要 5 分鐘的時間，可以先去泡杯咖啡在回來：D）
   
```bash
docker-compose up --build -d
```

6. 編譯智能合約

```bash
docker-compose exec hardhat pnpm build
```

7. 部屬智能合約

```bash
docker-compose exec hardhat pnpm dev
```

8. 在瀏覽器網址列輸入以下網址即可進入網站

```bash
http://localhost:3000
```

## 匯入錢包

在匯入錢包前，請先確認你已經成功[運行專案](#運行專案)，否則將無法匯入錢包

1. 開啟 MetaMask > 點擊網路 > 新增網路
<img width="356" alt="截圖 2023-06-19 下午6 16 30" src="https://github.com/justYu2001/bei-ke-box/assets/49834964/4e95572e-9ecd-43bd-9b5d-38b29e34d215">

<img width="362" alt="image" src="https://github.com/justYu2001/bei-ke-box/assets/49834964/b47f4ab4-36fe-4b75-b351-e8a0d05657d9">


2. 點擊最下方的[手動新增網路](chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#settings/networks/add-network)
<img width="1792" alt="246798892-a7e74f01-623e-40e9-92b1-4732192e3957" src="https://github.com/justYu2001/bei-ke-box/assets/49834964/38722217-87d4-4828-8807-d4ad2c1be681">

3. 根據下圖填入資料後按下儲存
<img width="438" alt="image" src="https://github.com/justYu2001/bei-ke-box/assets/49834964/ebdc1e71-9103-4cf9-96df-2708fbf20fa0">


4. 開啟 MetaMask > 點擊頭像 > 點擊匯入帳戶
<img width="350" alt="image" src="https://github.com/justYu2001/bei-ke-box/assets/49834964/bd849d1d-1091-49a2-ad78-ebeba66245d2">


5. 複製貼上要匯入帳戶的私鑰並點擊匯入
<img width="344" alt="image" src="https://github.com/justYu2001/bei-ke-box/assets/49834964/742066ed-6b33-482c-abe0-0284729ab418">


6. 完成
<img width="351" alt="image" src="https://github.com/justYu2001/bei-ke-box/assets/49834964/0f4fd938-c76e-4c39-a2cc-1c391d5a5ace">
