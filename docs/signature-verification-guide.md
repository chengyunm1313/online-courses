# ECPay CheckMacValue Signature Verification Guide

**Last Updated**: 2025-11-11

## Overview

The `CheckMacValue` signature verification is a critical security feature that ensures:
1. Payment notifications come from ECPay (not forged)
2. Payment data hasn't been tampered with during transmission

## Signature Calculation Algorithm

ECPay uses a specific algorithm for signature calculation. Your implementation in `lib/ecpay.ts` follows this exactly:

### Step-by-Step Process

```javascript
function generateCheckMacValue(params, hashKey, hashIV):
  1. Filter parameters (remove CheckMacValue field and undefined values)
  2. Sort parameters by key in ASCII order
  3. Build string: key1=value1&key2=value2&...
  4. Wrap with HashKey and HashIV: HashKey=xxx&params&HashIV=xxx
  5. URL Encode (ECPay rules: only 5 characters encoded)
  6. Convert to lowercase
  7. SHA256 hash
  8. Convert to uppercase
```

### ECPay's Unique URL Encoding Rules

ECPay doesn't use standard RFC URL encoding. Instead:

```javascript
encodeURIComponent(str)
  .replace(/%20/g, '+')   // Space → +
  .replace(/%21/g, '!')   // ! → !
  .replace(/%28/g, '(')   // ( → (
  .replace(/%29/g, ')')   // ) → )
  .replace(/%2A/gi, '*')  // * → *
```

This is different from standard URL encoding - ECPay leaves these 5 characters unencoded.

## Common Verification Failures

### Scenario 1: Signature Doesn't Match

**Symptoms**:
```
Received: ABC123...
Calculated: DEF456...
Match: false
```

**Possible Causes**:

1. **Different Parameters**
   - ECPay might include extra fields that aren't documented
   - Empty strings might be included or excluded differently
   - Field order might be different

2. **Encoding Issues**
   - Special characters (Chinese, emojis) encoded differently
   - Date format mismatch (e.g., `/` vs `-`)
   - Number vs string type differences

3. **Incorrect Credentials**
   - HashKey mismatch (test vs. production)
   - HashIV mismatch
   - Using wrong merchant ID

4. **Test Data Issues**
   - Using simulated/mock data instead of real ECPay response
   - Test data not actually signed by ECPay

### Scenario 2: Verification Failure in Production

When signature verification fails in the live environment:

1. **Check environment variables**
   ```bash
   # Verify these are correct
   ECPAY_HASH_KEY=xxxxx
   ECPAY_HASH_IV=xxxxx
   ```

2. **Enable detailed logging**
   In development mode, the code logs:
   - Filtered and sorted parameters
   - Raw string before encoding
   - Encoded string
   - Final hash

3. **Compare step-by-step**
   Use the test script to calculate locally and compare with received value

## Debugging Strategy

### 1. Enable Development Logging

The code already includes detailed logging in development:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[ECPay 簽章] 步驟 1-2：過濾並排序參數', {...});
  console.log('[ECPay 簽章] 步驟 3-5：參數組合與 URL 編碼', {...});
  console.log('[ECPay 簽章] 步驟 6-8：加密與轉換完成', {...});
}
```

### 2. Use Diagnostic Tools

A test script is available at `/tmp/debug-ecpay-signature.js`:

```bash
node /tmp/debug-ecpay-signature.js
```

This script:
- Shows parameters after filtering and sorting
- Displays the raw string before encoding
- Shows URL-encoded result
- Calculates and displays final signature
- Compares with expected value

### 3. Manual Verification

Use Node.js to verify calculation:

```javascript
const crypto = require('crypto');

const params = { /* your params */ };
const HASH_KEY = '...';
const HASH_IV = '...';

// 1. Filter and sort
const filtered = {};
Object.entries(params).forEach(([key, value]) => {
  if (value !== undefined && key !== 'CheckMacValue') {
    filtered[key] = value;
  }
});

const sortedKeys = Object.keys(filtered).sort();

// 2. Build string
const paramString = sortedKeys
  .map(key => `${key}=${filtered[key]}`)
  .join('&');

// 3. Add HashKey and HashIV
const rawString = `HashKey=${HASH_KEY}&${paramString}&HashIV=${HASH_IV}`;

// 4. URL encode (ECPay rules)
const encoded = encodeURIComponent(rawString)
  .replace(/%20/g, '+')
  .replace(/%21/g, '!')
  .replace(/%28/g, '(')
  .replace(/%29/g, ')')
  .replace(/%2A/gi, '*');

// 5-8. Hash and uppercase
const signature = crypto
  .createHash('sha256')
  .update(encoded.toLowerCase(), 'utf8')
  .digest('hex')
  .toUpperCase();

console.log('Calculated:', signature);
console.log('Received:', params.CheckMacValue);
console.log('Match:', signature === params.CheckMacValue);
```

## Testing with ECPay Test Environment

### Configuration

For test environment, use these credentials:

```bash
ECPAY_MERCHANT_ID=2000132
ECPAY_HASH_KEY=5294y06JbISpM5x9
ECPAY_HASH_IV=v77hoKGq4kWxNNIS
ECPAY_CASHIER_URL=https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5
```

### Test Cards

- **Success**: `4311-9522-2222-2222`
- **Failure**: Any other valid card format

### Verification in Test Environment

1. Make a test payment using the test card
2. ECPay will callback with real signed data
3. Your verification should pass because:
   - The CheckMacValue was calculated by ECPay
   - You're using the correct HashKey and HashIV
   - All parameters are exactly what ECPay sent

### Important Note

If verification fails even in test environment:
1. Check credentials are correct (copy-paste to avoid typos)
2. Verify `NODE_ENV` environment variable for development logging
3. Check Firestore is properly initialized
4. Verify request encoding (ensure UTF-8)

## Production Deployment

### Before Going Live

1. **Update Credentials**
   ```bash
   # Change from test to production credentials
   ECPAY_MERCHANT_ID=your_merchant_id  # Not 2000132
   ECPAY_HASH_KEY=your_production_key
   ECPAY_HASH_IV=your_production_iv
   ECPAY_CASHIER_URL=https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5
   ```

2. **Test Thoroughly**
   - Make test transactions
   - Verify signatures pass
   - Check order creation and status updates

3. **Monitor Logs**
   - Watch for signature verification failures
   - Alert if verification fails repeatedly
   - Log all payment callbacks for audit

### Signature Verification Failures in Production

If signatures fail in production:

1. **Don't ignore them** - it could indicate:
   - Man-in-the-middle attack attempts
   - Data corruption in transmission
   - Changed credentials accidentally

2. **Investigate immediately**:
   - Check if credentials changed
   - Verify no recent code changes to signature logic
   - Check if ECPay changed their algorithm (unlikely)

3. **Failsafe behavior**:
   - Current code rejects failed signatures ✓
   - Orders don't update on invalid signatures ✓
   - Logs capture the mismatch for investigation ✓

## Security Considerations

### What This Protects Against

1. **Forged notifications**: Attacker can't create valid signatures without HashKey/HashIV
2. **Tampering**: Changing payment amount or status will invalidate signature
3. **Replay attacks**: Each legitimate notification is unique

### What This Doesn't Protect Against

1. **Stolen HashKey/HashIV**: If credentials leak, attacker can forge signatures
2. **Network eavesdropping**: HTTPS must be enforced (handled by Next.js)
3. **Timing attacks**: Not relevant for synchronous signature verification

### Best Practices

1. **Keep credentials secure**
   - Store only in environment variables
   - Never commit to Git
   - Use secrets management in production

2. **Use HTTPS everywhere**
   - Enable on development (use ngrok if needed)
   - Verify in production

3. **Log everything**
   - Log all payment callbacks
   - Log verification failures
   - Maintain audit trail

4. **Monitor signatures**
   - Alert on repeated verification failures
   - Track success rate
   - Review logs regularly

## References

- [ECPay Official Documentation](https://developers.ecpay.com.tw/)
- [CheckMacValue Specification](https://developers.ecpay.com.tw/docs/ecpay-payment-integration-overview)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)

## Troubleshooting Checklist

- [ ] Verified credentials are correct (HashKey, HashIV)
- [ ] Verified environment (`NODE_ENV` affects logging)
- [ ] Checked for special characters in parameters
- [ ] Tested with actual ECPay test environment
- [ ] Reviewed detailed debug logs
- [ ] Manually calculated signature matches ECPay's
- [ ] Confirmed UTF-8 encoding
- [ ] Verified request is from ECPay (not spoofed)

## Version History

| Date | Change |
| --- | --- |
| 2025-11-11 | Initial documentation |
| 2025-11-11 | Added diagnostic script reference |
