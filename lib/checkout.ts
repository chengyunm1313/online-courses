const DISCOUNT_CODES: Record<
  string,
  { type: "percentage" | "amount"; value: number; description: string }
> = {
  WELCOME10: {
    type: "percentage",
    value: 0.1,
    description: "新會員九折優惠",
  },
  STUDENT200: {
    type: "amount",
    value: 200,
    description: "學生專屬折抵 NT$200",
  },
  VIP500: {
    type: "amount",
    value: 500,
    description: "VIP 折抵 NT$500",
  },
};

export type DiscountResult = {
  valid: boolean;
  code?: string | null;
  message: string;
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
};

export function evaluateDiscount(
  originalPrice: number,
  rawCode?: string | null
): DiscountResult {
  const normalizedPrice = Math.max(Number(originalPrice) || 0, 0);
  const normalizedCode = rawCode?.trim().toUpperCase() ?? "";

  if (!normalizedCode) {
    return {
      valid: true,
      code: null,
      message: "未套用折扣碼，將以原價結帳。",
      originalPrice: normalizedPrice,
      finalPrice: normalizedPrice,
      discountAmount: 0,
    };
  }

  const discount = DISCOUNT_CODES[normalizedCode];

  if (!discount) {
    return {
      valid: false,
      code: normalizedCode,
      message: "折扣碼無效或已過期。",
      originalPrice: normalizedPrice,
      finalPrice: normalizedPrice,
      discountAmount: 0,
    };
  }

  let discountAmount = 0;

  if (discount.type === "percentage") {
    discountAmount = Math.round(normalizedPrice * discount.value);
  } else {
    discountAmount = discount.value;
  }

  const finalPrice = Math.max(normalizedPrice - discountAmount, 0);

  return {
    valid: true,
    code: normalizedCode,
    message: `${discount.description}，已套用優惠。`,
    originalPrice: normalizedPrice,
    finalPrice,
    discountAmount,
  };
}

export function listAvailableDiscountCodes() {
  return Object.entries(DISCOUNT_CODES).map(([code, value]) => ({
    code,
    description: value.description,
    type: value.type,
    value: value.value,
  }));
}
