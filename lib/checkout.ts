import {
  getDiscountByCodeFromStore,
  incrementDiscountUsage,
  listDiscountsFromStore,
} from "@/lib/d1-repository";

export type DiscountResult = {
  valid: boolean;
  code?: string | null;
  message: string;
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  discountId?: string;
};

interface EvaluateDiscountInput {
  originalPrice: number;
  rawCode?: string | null;
  courseIds?: string[];
}

function isActiveBetween(startsAt?: string, endsAt?: string) {
  const now = Date.now();
  if (startsAt) {
    const startTime = new Date(startsAt).getTime();
    if (!Number.isNaN(startTime) && now < startTime) {
      return false;
    }
  }
  if (endsAt) {
    const endTime = new Date(endsAt).getTime();
    if (!Number.isNaN(endTime) && now > endTime) {
      return false;
    }
  }
  return true;
}

export async function evaluateDiscount({
  originalPrice,
  rawCode,
  courseIds = [],
}: EvaluateDiscountInput): Promise<DiscountResult> {
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

  const discount = await getDiscountByCodeFromStore(normalizedCode);
  if (!discount || !discount.enabled) {
    return {
      valid: false,
      code: normalizedCode,
      message: "折扣碼無效或已停用。",
      originalPrice: normalizedPrice,
      finalPrice: normalizedPrice,
      discountAmount: 0,
    };
  }

  if (!isActiveBetween(discount.startsAt, discount.endsAt)) {
    return {
      valid: false,
      code: normalizedCode,
      message: "折扣碼尚未開始或已過期。",
      originalPrice: normalizedPrice,
      finalPrice: normalizedPrice,
      discountAmount: 0,
    };
  }

  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    return {
      valid: false,
      code: normalizedCode,
      message: "折扣碼已達使用上限。",
      originalPrice: normalizedPrice,
      finalPrice: normalizedPrice,
      discountAmount: 0,
    };
  }

  if (discount.minimumAmount && normalizedPrice < discount.minimumAmount) {
    return {
      valid: false,
      code: normalizedCode,
      message: `訂單金額需滿 NT$ ${discount.minimumAmount.toLocaleString()} 才能使用此折扣碼。`,
      originalPrice: normalizedPrice,
      finalPrice: normalizedPrice,
      discountAmount: 0,
    };
  }

  if (
    discount.courseIds.length > 0 &&
    !courseIds.some((courseId) => discount.courseIds.includes(courseId))
  ) {
    return {
      valid: false,
      code: normalizedCode,
      message: "此折扣碼不適用於目前選購的課程。",
      originalPrice: normalizedPrice,
      finalPrice: normalizedPrice,
      discountAmount: 0,
    };
  }

  const discountAmount =
    discount.type === "percentage"
      ? Math.round(normalizedPrice * discount.value)
      : Math.round(discount.value);
  const finalPrice = Math.max(normalizedPrice - discountAmount, 0);

  return {
    valid: true,
    code: normalizedCode,
    message: discount.description
      ? `${discount.description}，已套用優惠。`
      : "折扣碼已成功套用。",
    originalPrice: normalizedPrice,
    finalPrice,
    discountAmount,
    discountId: discount.id,
  };
}

export async function listAvailableDiscountCodes() {
  const discounts = await listDiscountsFromStore();
  return discounts
    .filter((discount) => discount.enabled && isActiveBetween(discount.startsAt, discount.endsAt))
    .map((discount) => ({
      id: discount.id,
      code: discount.code,
      description: discount.description,
      type: discount.type,
      value: discount.value,
      minimumAmount: discount.minimumAmount,
      usageLimit: discount.usageLimit,
      usageCount: discount.usageCount,
      courseIds: discount.courseIds,
    }));
}

export async function consumeDiscountUsage(discountId?: string) {
  if (!discountId) {
    return;
  }
  await incrementDiscountUsage(discountId);
}
