/**
 * DEBUG 路由：用於診斷 CheckMacValue 驗證問題
 *
 * 這個路由會接收完整的支付參數，並進行詳細的簽章計算診斷
 *
 * 使用方式：
 * 1. 複製 [Payment Result] 接收到的完整參數 JSON
 * 2. 執行：curl -X POST http://localhost:3000/api/payment/result-debug -H "Content-Type: application/json" -d '<JSON>'
 * 或者在瀏覽器中打開 /api/payment/result-debug?test=1 進行測試
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function urlEncodeForECPay(str: string): string {
	return encodeURIComponent(str)
		.replace(/%20/g, '+')
		.replace(/%21/g, '!')
		.replace(/%28/g, '(')
		.replace(/%29/g, ')')
		.replace(/%2A/gi, '*');
}

export async function POST(request: NextRequest) {
	try {
		const params = await request.json();
		const HASH_KEY = process.env.ECPAY_HASH_KEY || '5294y06JbISpM5x9';
		const HASH_IV = process.env.ECPAY_HASH_IV || 'v77hoKGq4kWxNNIS';

		console.log('═══════════════════════════════════════════════════════════');
		console.log('        ECPay CheckMacValue 詳細診斷');
		console.log('═══════════════════════════════════════════════════════════\n');

		// 過濾參數（排除 undefined、空字符串、CheckMacValue）
		const filtered: Record<string, string | number> = {};
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '' && key !== 'CheckMacValue') {
				if (typeof value === 'string' || typeof value === 'number') {
					filtered[key] = value;
				}
			}
		});

		// 嘗試不同的排序方式
		const sortMethods = [
			{ name: '標準 ASCII (a < b)', fn: (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0) },
			{ name: 'localeCompare', fn: (a: string, b: string) => a.localeCompare(b) },
			{
				name: 'charCode',
				fn: (a: string, b: string) => {
					for (let i = 0; i < Math.min(a.length, b.length); i++) {
						const diff = a.charCodeAt(i) - b.charCodeAt(i);
						if (diff !== 0) return diff;
					}
					return a.length - b.length;
				},
			},
		];

		const results = [];

		for (const method of sortMethods) {
			const sortedKeys = Object.keys(filtered).sort(method.fn);
			const paramString = sortedKeys.map((key) => `${key}=${filtered[key]}`).join('&');

			const rawString = `HashKey=${HASH_KEY}&${paramString}&HashIV=${HASH_IV}`;
			const encoded = urlEncodeForECPay(rawString);
			const lowercase = encoded.toLowerCase();
			const sig = crypto.createHash('sha256').update(lowercase, 'utf8').digest('hex').toUpperCase();

			const isMatch = sig === String(params.CheckMacValue);

			results.push({
				method: method.name,
				sortedKeys,
				paramString,
				signature: sig,
				match: isMatch,
			});

			console.log(`【方式：${method.name}】`);
			console.log(`排序後的鍵 (${sortedKeys.length}個):`);
			console.log(sortedKeys.join(', '));
			console.log(`\n原始字串長度: ${rawString.length}`);
			console.log(`URL編碼後長度: ${encoded.length}`);
			console.log(`轉小寫後長度: ${lowercase.length}`);
			console.log(`\n計算的簽章: ${sig}`);
			console.log(`接收的簽章: ${params.CheckMacValue}`);
			console.log(`匹配: ${isMatch ? '✅ 是' : '❌ 否'}`);

			// 如果還有其他診斷信息
			if (method.name === '標準 ASCII (a < b)') {
				console.log(`\n🔍 詳細信息：`);
				console.log(`  參數字串: ${paramString.substring(0, 200)}...`);
				console.log(`  原始字串: ${rawString.substring(0, 200)}...`);
				console.log(`  URL編碼: ${encoded.substring(0, 200)}...`);
			}

			console.log('───────────────────────────────────────────────────────────\n');
		}

		// 檢查是否有任何方式匹配
		const matchedResult = results.find((r) => r.match);

		if (matchedResult) {
			console.log(`\n🎉 找到匹配的排序方式：${matchedResult.method}`);
			console.log(`\n修復方案：`);
			console.log(`在 lib/ecpay.ts 的 generateCheckMacValue 函式中，`);
			console.log(`更改排序邏輯為該方式。\n`);
		} else {
			console.log('\n❌ 所有排序方式都不匹配');
			console.log('\n可能的原因：');
			console.log('1. URL 編碼規則不同');
			console.log('2. 某些參數被過濾不同');
			console.log('3. 參數值有微妙的差異（空格、換行等）');
			console.log('4. HASH_KEY 或 HASH_IV 錯誤\n');

			// 詳細診斷
			console.log('詳細信息：');
			console.log(`  HASH_KEY: ${HASH_KEY}`);
			console.log(`  HASH_IV: ${HASH_IV}`);
			console.log(`  參數數量: ${Object.keys(filtered).length}`);
			console.log(`  接收的簽章長度: ${String(params.CheckMacValue).length}`);
			console.log(`  我們計算的簽章長度: ${results[0].signature.length}\n`);
		}

		return NextResponse.json({
			receivedCheckMacValue: params.CheckMacValue,
			results: results.map((r) => ({
				method: r.method,
				signature: r.signature,
				match: r.match,
				sortedKeys: r.sortedKeys,
			})),
			matchedMethod: matchedResult?.method || null,
		});
	} catch (error) {
		console.error('[DEBUG Error]', error);
		return NextResponse.json({ error: String(error) }, { status: 500 });
	}
}

export async function GET(request: NextRequest) {
	// 測試端點 - 用於快速驗證
	const testData = {
		AlipayID: '',
		AlipayTradeNo: '',
		amount: '5000',
		ATMAccBank: '',
		ATMAccNo: '',
		auth_code: '777777',
		card4no: '2222',
		card6no: '431195',
		CustomField1: '',
		CustomField2: '',
		CustomField3: '',
		CustomField4: '',
		eci: '0',
		ExecTimes: '',
		Frequency: '',
		gwsr: '14000288',
		MerchantID: '2000132',
		MerchantTradeNo: '20251111142538YTZIHA',
		PayFrom: '',
		PaymentDate: '2025/11/11 14:25:38',
		PaymentNo: '',
		PaymentType: 'Credit_CreditCard',
		PaymentTypeChargeFee: '100',
		PeriodAmount: '',
		PeriodType: '',
		process_date: '2025/11/11 14:25:38',
		red_dan: '0',
		red_de_amt: '0',
		red_ok_amt: '0',
		red_yet: '0',
		RtnCode: '1',
		RtnMsg: 'Succeeded',
		SimulatePaid: '0',
		staed: '0',
		stage: '0',
		stast: '0',
		StoreID: '',
		TenpayTradeNo: '',
		TotalSuccessAmount: '',
		TotalSuccessTimes: '',
		TradeAmt: '5000',
		TradeDate: '2025/11/11 14:25:00',
		TradeNo: '2511111425380001',
		WebATMAccBank: '',
		WebATMAccNo: '',
		WebATMBankName: '',
		CheckMacValue: 'E5984394CA615F5FBAF3ECF290ED1C6039E296CE764B1229DB56E5C5D965B9E4',
	};

	const body = JSON.stringify(testData);
	const incomingRequest = new Request('http://localhost:3000/api/payment/result-debug', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body,
	});

	return POST(incomingRequest as NextRequest);
}
