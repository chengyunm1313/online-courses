# CheckMacValue Parameter Filtering Fix

**Date**: 2025-11-11
**Status**: ✅ Applied and Committed
**Commit**: b526878

## Problem Identified

There was a **critical inconsistency** in parameter filtering logic across three payment endpoints:

### Before Fix (Inconsistent)
- **`lib/ecpay.ts`** (generateCheckMacValue): Filtered out empty strings
  ```typescript
  if (value !== undefined && value !== '' && key !== 'CheckMacValue')
  ```
- **`app/api/payment/result/route.ts`** (signature verification logging): Included empty strings
  ```typescript
  if (value !== undefined && key !== 'CheckMacValue')
  ```
- **`app/api/payment/result-debug/route.ts`** (diagnostic tool): Included empty strings
  ```typescript
  if (value !== undefined && key !== 'CheckMacValue')
  ```

**Impact**: The result handler and debug tool were calculating signatures differently than the actual verification logic, making it impossible to accurately diagnose signature mismatches.

## Solution Applied

All three locations now use **identical filtering logic**:

```typescript
if (value !== undefined && value !== '' && key !== 'CheckMacValue') {
  // Include this parameter in signature calculation
}
```

### Files Updated

1. **`app/api/payment/result/route.ts`** (lines 69-71)
   - Updated parameter filtering in debug output
   - Updated comment to reflect correct logic

2. **`app/api/payment/result-debug/route.ts`** (lines 37-39)
   - Updated parameter filtering in diagnostic tool
   - Now tests all sorting methods with correct parameter set

## Why This Matters

### ECPay Signature Calculation Rules

According to ECPay's official specification, parameters are filtered as follows:

1. **Remove**: `CheckMacValue` field (the signature itself)
2. **Remove**: `undefined` values (not provided)
3. **Remove**: Empty strings (ECPay doesn't include fields with no value)
4. **Include**: All other parameters with actual values

### The Bug's Impact

Previously, the diagnostic tool was including empty strings like:
```
CustomField1=&CustomField2=&CustomField3=&CustomField4=&...
```

But the actual signature verification was calculated without them:
```
CustomField1 omitted
CustomField2 omitted
CustomField3 omitted
CustomField4 omitted
```

This meant:
- Diagnostic tool: Showed 46 parameters
- Actual verification: Used maybe 30-35 parameters
- Result: All 3 sorting methods in diagnostic appeared to fail, when actually they should match

## Next Steps

### Immediate: Test with Real Payment Data

1. **Complete a real payment flow**:
   ```bash
   npm run dev
   ```
   - Purchase a course
   - Enter test card details in ECPay payment page
   - Complete the payment

2. **Check the logs**:
   ```
   [Payment Result] 簽章驗證詳情: {
     match: true  ← Should now see this!
   }
   ```

3. **Verify redirect works**:
   - Should automatically redirect to `/order/{id}/result`
   - Should see "付款成功！" thank you page

### If Signature Still Doesn't Match

1. **Run diagnostic with new payment**:
   ```bash
   curl -X POST http://localhost:3000/api/payment/result-debug \
     -H "Content-Type: application/json" \
     -d '<complete-payment-params-json>'
   ```

2. **Compare with new parameter count**:
   - Should show fewer parameters than before
   - Should see one of the sorting methods match

3. **Collect data**:
   - Screenshot of diagnostic output
   - Log output from payment result handler
   - The received CheckMacValue from ECPay

## Technical Details

### Parameter Filtering Logic

```typescript
const filteredParams: Record<string, string | number> = {};

Object.entries(params).forEach(([key, value]) => {
  // Include only if:
  // 1. value is not undefined (parameter was provided)
  // 2. value is not an empty string (has actual content)
  // 3. key is not 'CheckMacValue' (not the signature itself)
  if (value !== undefined && value !== '' && key !== 'CheckMacValue') {
    filteredParams[key] = value;
  }
});
```

### Signature Calculation Steps

With filtered parameters:

1. **Sort** by key (ASCII order)
2. **Combine** as `key=value&key=value&...`
3. **Add** HashKey/IV: `HashKey=...&params&HashIV=...`
4. **URL Encode** (ECPay rules: only 5 characters)
5. **Lowercase** the entire string
6. **SHA256** hash
7. **Uppercase** result

## Verification Checklist

- [x] `lib/ecpay.ts` filtering logic
- [x] `app/api/payment/result/route.ts` filtering logic
- [x] `app/api/payment/result-debug/route.ts` filtering logic
- [x] Comments updated to match actual behavior
- [x] Changes committed

## Related Files

- [lib/ecpay.ts](../../lib/ecpay.ts#L63-L75) - generateCheckMacValue function
- [app/api/payment/result/route.ts](../../app/api/payment/result/route.ts#L64-L76) - Result handler logging
- [app/api/payment/result-debug/route.ts](../../app/api/payment/result-debug/route.ts#L34-L40) - Diagnostic tool

## Expected Outcome

After this fix and successful payment test:

```
✅ CheckMacValue verification passes
✅ Order status updates to PAID
✅ Redirect to /order/{id}/result succeeds
✅ Thank you page displays correctly
```

---

**Status**: Ready for real payment testing
**Next Action**: Execute payment flow test with test card
