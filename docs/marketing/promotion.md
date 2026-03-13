# 一套成熟的線上課程販售功能架構

## 1️⃣ 價格階梯（Dynamic Pricing / Tier Pricing）

這是最基本也最重要的轉換機制。

### 常見模式

| 手法       | 說明          | 建議功能          |
| -------- | ----------- | ------------- |
| 早鳥價      | 前期最便宜       | 設定日期或名額       |
| 午鳥價      | 第二階段        | 自動漲價          |
| 晚鳥價      | 最後階段        | 最貴            |
| 倒數漲價     | 每 X 天漲價     | Timer + 自動調價  |
| 名額漲價     | 每賣 N 份漲價    | 例：每 100 人漲    |
| 限時優惠     | 24hr / 48hr | countdown     |
| Launch 價 | 上線期優惠       | launch window |

### 建議做成系統

**Price Ladder Engine**

```text
Tier 1: 早鳥價 $1990
- limit: 100 seats
- expire: 2026-05-01

Tier 2: 午鳥價 $2490
- limit: 300 seats

Tier 3: 原價 $3290
```

網站自動：

* 顯示目前價格
* 顯示下一階段價格
* 顯示剩餘名額
* 顯示倒數

轉換率會大幅提升。

---

# 2️⃣ 優惠券系統（Coupon Engine）

成熟課程網站幾乎都有完整 Coupon Engine。

### 常見優惠類型

| 類型   | 範例         |
| ---- | ---------- |
| 固定折扣 | -$500      |
| 百分比  | 20% off    |
| 限定名額 | 前 100 使用   |
| 限定時間 | 48hr       |
| 限定用戶 | 老學員        |
| 限定來源 | FB / LINE |
| 一次性  | 每人只能用一次    |

### 常見策略

**1 直接跳 coupon**

```
https://course.com/?coupon=launch50
```

自動套用

---

**2 自動彈 coupon**

行為觸發：

* 停留 30 秒
* scroll 60%
* 離開意圖（exit intent）

彈出：

```
限時優惠碼
SAVE300
```

---

# 3️⃣ 心理觸發（Conversion Psychology）

這是轉換率核心。

### 稀缺性

顯示

```
剩餘名額：12
```

或

```
已售 438 份
```

---

### 倒數計時

常見

```
優惠剩餘
23:14:08
```

可搭配：

* cookie
* global timer

---

### 社會證明

顯示

```
已經有 3241 位學員加入
```

或

```
剛剛有人購買
```

---

### 動態購買提示

```
Kevin from Taipei just purchased
```

（Shopify 很常見）

---

# 4️⃣ Lead Capture（名單收集）

很多人不會直接買。

所以成熟課程一定會做：

### 免費內容交換

| 方式                | 範例         |
| ----------------- | ---------- |
| 免費章節              | 第一課        |
| PDF               | cheatsheet |
| webinar           | 線上講座       |
| email mini course | 7天教學       |

---

### 功能

Lead Form

```
輸入 email
領取優惠
```

系統自動：

* 寄 coupon
* 加入 email funnel

---

# 6️⃣ 限時 Launch（課程開賣模式）

很多高轉換課程會用 **launch model**。

流程：

```
預熱期
↓

免費內容
↓

開賣
↓

關閉
```

例如

```
開賣 5 天
```

關閉後：

```
waitlist
```

---

# 7️⃣ Waitlist（等待名單）

當課程未開放

```
加入等待名單
```

收 email

開賣通知。

---


# 9️⃣ Bundle / Upsell

購買時加購。

### Upsell

結帳後

```
加 $990
取得進階課
```

---

### Bundle

```
原價 $5990
現在 $3990
```

---

# 🔟 團購 / 團體價

很適合 B2B。

例

| 人數 | 價格    |
| -- | ----- |
| 1  | $2990 |
| 5  | $1990 |
| 20 | $990  |

---

# 11️⃣ 分期付款

高價課程常見。

```
$7990
或
3 x $2990
```

---

# 12️⃣ 保證機制

增加信任。

例如

```
7 天退款
```

或

```
30 天退款
```

---

# 13️⃣ 學員見證系統

顯示

* 評價
* 成果
* before after

---

# 14️⃣ 成交優化 UI

很多網站會做：

### Sticky CTA

頁面底部固定

```
立即購買
```

---

### FAQ 區塊

降低疑慮。

---

### 課程大綱折疊

增加資訊。

---

# 15️⃣ 會員升級

例如

```
VIP member
```

享有

* 折扣
* 專屬課程

---

# 建議你的網站系統架構

如果你要做 **完整課程銷售系統**。

我會建議設計這幾個核心模組：

```
Course System
Pricing Engine
Coupon Engine
Launch System
Affiliate System
LINE Automation
Lead Capture
Checkout System
Analytics
```

---

# 最成熟的課程網站通常會有

完整 feature list：

```
價格階梯
倒數計時
優惠券
名額限制
waitlist
email funnel
affiliate
upsell
bundle
團購
分期
見證
coupon link
popup
analytics
```

