import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { consumeDiscountUsage, evaluateDiscount } from "@/lib/checkout";
import { createAnalyticsEvent, createOrderRecord } from "@/lib/d1-repository";
import {
  generateCheckMacValue,
  generateMerchantTradeNo,
  getECPayConfig,
  prepareECPayParams,
} from "@/lib/ecpay";
import { getPublishedCourseById } from "@/lib/public-courses";
import { sendOrderCreatedEmail } from "@/lib/notifications";
import { sanitizeLogContext } from "@/lib/logging";

interface CheckoutRequestBody {
  courseId?: string;
  courseIds?: string[];
  paymentMethod?: "CREDIT" | "ATM";
  discountCode?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }

    const body = (await request.json()) as CheckoutRequestBody;
    const courseIds = Array.from(
      new Set(
        [
          ...(body.courseId ? [body.courseId] : []),
          ...((body.courseIds ?? []).filter((courseId) => typeof courseId === "string")),
        ].filter(Boolean),
      ),
    );

    if (courseIds.length === 0) {
      return NextResponse.json({ error: "請至少選擇一門課程" }, { status: 400 });
    }

    const courses = await Promise.all(courseIds.map((courseId) => getPublishedCourseById(courseId)));
    if (courses.some((course) => !course)) {
      return NextResponse.json({ error: "課程不存在或未上架" }, { status: 404 });
    }

    const resolvedCourses = courses.filter((course): course is NonNullable<typeof course> => Boolean(course));
    const subtotal = resolvedCourses.reduce((sum, course) => sum + course.price, 0);
    const discount = await evaluateDiscount({
      originalPrice: subtotal,
      rawCode: body.discountCode,
      courseIds,
    });
    if (!discount.valid) {
      return NextResponse.json({ error: discount.message }, { status: 400 });
    }

    const total = discount.finalPrice;
    const discountAmount = Math.max(subtotal - total, 0);
    const paymentMethod = body.paymentMethod === "ATM" ? "ATM" : "CREDIT";
    const merchantTradeNo = generateMerchantTradeNo();

    const orderId = await createOrderRecord({
      userId: session.user.id,
      userName: session.user.name ?? "",
      userEmail: session.user.email ?? "",
      items: resolvedCourses.map((course) => ({
        courseId: course.id,
        courseTitle: course.title,
        courseThumbnail: course.thumbnail,
        instructor: course.instructor.name,
        price: course.price,
      })),
      subtotal,
      discountAmount,
      tax: 0,
      total,
      status: "CREATED",
      paymentMethod,
      merchantTradeNo,
      notes: body.notes?.trim() || discount.code ? [body.notes?.trim(), discount.code ? `折扣碼: ${discount.code}` : ""].filter(Boolean).join("\n") : undefined,
      reconciliationStatus: "pending",
      refundStatus: "none",
    });
    await createAnalyticsEvent({
      eventName: "order_created",
      userId: session.user.id,
      courseId: resolvedCourses[0]?.id,
      orderId,
      discountCode: discount.code || undefined,
      paymentMethod,
      amount: total,
      payload: {
        courseCount: resolvedCourses.length,
      },
    });
    await consumeDiscountUsage(discount.discountId);

    if (session.user.email) {
      void sendOrderCreatedEmail({
        orderId,
        to: session.user.email,
        courseTitles: resolvedCourses.map((course) => course.title),
        total,
      });
    }

    console.log("[checkout] order created", sanitizeLogContext({
      orderId,
      merchantTradeNo,
      paymentMethod,
      courseCount: resolvedCourses.length,
      total,
    }));

    if (paymentMethod === "ATM") {
      return NextResponse.json({
        orderId,
        redirectUrl: `/order/${orderId}/result?payment=atm`,
      });
    }

    const config = getECPayConfig();
    const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const ecpayParams = prepareECPayParams(
      merchantTradeNo,
      Math.round(total),
      resolvedCourses.map((course) => course.title).join(", ").slice(0, 200),
      config.merchantId,
      appBaseUrl,
      "Credit",
    );
    const checkMacValue = generateCheckMacValue(ecpayParams, config.hashKey, config.hashIV);

    return NextResponse.json({
      orderId,
      paymentMethod: "CREDIT",
      form: {
        action: config.cashierUrl,
        fields: {
          ...ecpayParams,
          CheckMacValue: checkMacValue,
        },
      },
    });
  } catch (error) {
    console.error("[checkout] error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "建立訂單失敗" },
      { status: 500 },
    );
  }
}
