# Payment Testing Guide - After Parameter Filtering Fix

## Quick Start (5-10 minutes)

### 1. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in browser.

### 2. Purchase a Course
1. Click "瀏覽課程" (Browse Courses)
2. Select any course
3. Click "立即報名" (Enroll Now) button
4. Login if not already logged in
5. Complete course enrollment
6. Click checkout/payment button

### 3. Complete Payment in ECPay

When redirected to ECPay payment page:

**Use Test Card**:
```
卡號: 4111-1111-1111-1111
有效期: 12/25 (or any future date)
CVV: 123
密碼: 123456
```

**Click**: 送出
(Wait for payment processing)

### 4. Check Results

#### Success Case (What We're Aiming For):
```
✅ Automatically redirect to /order/{id}/result
✅ See "付款成功！" (Payment Successful) page
✅ Transaction details display correctly
✅ Course appears in /learning page
```

#### Debug Logs (Check Browser Console & Terminal):
```
Terminal:
[Payment Result] ✓ CheckMacValue 驗證成功
[Payment Result] 訂單狀態已更新
[Payment Result] 重定向到訂單詳情頁
```

#### What Changed

The parameter filtering now **consistently excludes empty strings** across:
- Signature calculation in `lib/ecpay.ts`
- Debug logging in result handler
- Diagnostic tool testing

This should resolve the signature mismatch if ECPay's implementation also excludes empty fields.

## If Payment Still Fails

### 1. Check Signature Verification Failure

**Log Entry**:
```
[Payment Result] ❌ CheckMacValue 驗證失敗:
  received: 'E5984394CA...'
  calculated: '8440D789B0...'
```

### 2. Run Diagnostic Tool

Extract the complete parameters from the server log and run:

```bash
curl -X POST http://localhost:3000/api/payment/result-debug \
  -H "Content-Type: application/json" \
  -d '{
    "AlipayID": "",
    "amount": "5000",
    "MerchantID": "2000132",
    ...all the parameters from the payment...
    "CheckMacValue": "E5984394CA..."
  }'
```

**Expected Output**:
```
【方式：標準 ASCII (a < b)】
排序後的鍵 (XX個):
...keys...

計算的簽章: 8440D789B0EA79EEBE14909DA418A7DDBEDFC41DD5CEB8435078D2392A7E104
接收的簽章: E5984394CA615F5FBAF3ECF290ED1C6039E296CE764B1229DB56E5C5D965B9E4
匹配: ❌ 否
```

### 3. Provide Diagnostic Output

If still failing, share:
1. Full diagnostic output (parameter count, sorting method used)
2. Server logs from payment result handler
3. Confirmation of environment variables:
   ```bash
   echo $ECPAY_HASH_KEY
   echo $ECPAY_HASH_IV
   echo $ECPAY_MERCHANT_ID
   ```

## Expected Parameter Count After Fix

**Before Fix**: 46 parameters (including empty strings)
**After Fix**: Should be fewer (maybe 30-35) - only parameters with actual values

## Common Test Cards for ECPay

| Card Type | Number | Status |
|-----------|--------|--------|
| Visa | 4111-1111-1111-1111 | ✅ Success |
| MasterCard | 5555-5555-5555-4444 | ✅ Success |
| JCB | 3530-1113-3330-0000 | ✅ Success |

All test cards use:
- **有效期**: 12/25 or any future date
- **CVV**: Any 3 digits (e.g., 123)
- **密碼**: 123456 (or any numeric PIN)

## Next Steps After Successful Payment

### 1. Verify Order Status
Navigate to `/learning` page to confirm course appears in your enrollments.

### 2. Check Database
In Firebase Console → Collections → `orders`:
- Find your order by `merchantTradeNo`
- Verify `status: 'PAID'`
- Check `ecpayData` object has payment details

### 3. Test Thank You Page
- Visit `/order/{orderId}/result` directly
- Confirm all transaction details display
- Check "下一步" (Next Steps) section

## Troubleshooting

### Signature Still Doesn't Match After Update

**Possible Causes**:
1. ✅ Fixed: Parameter filtering inconsistency
2. ⚠️ Possible: ECPay might have different URL encoding rules
3. ⚠️ Possible: ECPay might include/exclude parameters differently
4. ⚠️ Possible: Test data doesn't match real payment flow

**Solution**:
- Test with real payment (not simulated data)
- Compare diagnostic output parameter count
- If still wrong, may need to contact ECPay support

### "Payment invalid" Page After Payment

**What It Means**:
Signature verification failed, system rejected the payment for security.

**Not a Bug**:
This is correct behavior - we want to reject payments with invalid signatures.

**Next Steps**:
1. Run diagnostic tool with payment data
2. Check if parameter count changed after fix
3. Confirm environment variables are correct

### Redirect Not Working

**If You See**: Browser stays on ECPay payment page

**Possible Causes**:
1. JavaScript in form doesn't auto-submit (try clicking anything)
2. Browser blocked redirect
3. Network issue

**Manual Test**:
1. Copy URL from address bar
2. Open developer console
3. Check Network tab for `/api/payment/result` request

## Success Indicators

### Logs Show Signature Match
```
✅ [Payment Result] ✓ CheckMacValue 驗證成功
✅ [Payment Result] 訂單狀態已更新: PAID
✅ [Payment Result] 重定向到訂單詳情頁
```

### Page Displays Correctly
```
✅ Thank you message shown
✅ Transaction number displays
✅ Course payment details visible
✅ Order ID matches database
```

### Database Updated
```
✅ Order status = 'PAID'
✅ paidAt timestamp set
✅ ecpayData contains payment details
```

---

**Last Updated**: 2025-11-11 (after parameter filtering fix)
**Status**: Ready for testing
