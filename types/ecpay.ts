/**
 * 綠界 ECPay 相關類型定義
 */

export interface ECPayConfig {
  merchantId: string;
  hashKey: string;
  hashIV: string;
  cashierUrl: string;
}

export interface ECPayAIOParams extends Record<string, string | number | undefined> {
  MerchantID: string;
  MerchantTradeNo: string;
  MerchantTradeDate: string;
  PaymentType: 'aio';
  TotalAmount: number;
  TradeDesc: string;
  ItemName: string;
  ReturnURL: string;
  ChoosePayment: 'Credit' | 'ATM' | 'WebATM' | 'CVS' | 'BARCODE' | 'ALL';
  EncryptType: 1 | 0;
  ClientBackURL?: string;
  OrderResultURL?: string;
  NeedExtraPaidInfo?: 'Y' | 'N';
  CheckMacValue?: string;
  StoreID?: string;
  InvoiceMarkup?: number;
  CustomField1?: string;
  CustomField2?: string;
  CustomField3?: string;
  CustomField4?: string;
}

export interface ECPayCallbackParams {
  MerchantTradeNo: string;
  RtnCode: number;
  RtnMsg: string;
  TradeNo: string;
  TradeAmt: number;
  PaymentDate: string;
  PaymentType: string;
  PaymentTypeChargeFee: number;
  TradeDate: string;
  SimulatePaid: number;
  CheckMacValue: string;
  card4no?: string;
  card6no?: string;
  AuthCode?: string;
  StoreID?: string;
}

export interface ECPayData {
  RtnCode: number;
  RtnMsg: string;
  TradeNo: string;
  TradeAmt: number;
  PaymentDate: string;
  PaymentType: string;
  PaymentTypeChargeFee: number;
  TradeDate: string;
  SimulatePaid: number;
  CheckMacValue: string;
  card4no?: string;
  card6no?: string;
  AuthCode?: string;
  StoreID?: string;
}

export interface OrderEventPayload {
  merchantTradeNo: string;
  rtnCode?: number;
  rtnMsg?: string;
  ecpayData?: ECPayData;
  error?: string;
}
