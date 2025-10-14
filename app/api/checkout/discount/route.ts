import { NextResponse } from "next/server";
import { getPublishedCourseById } from "@/lib/public-courses";
import { evaluateDiscount } from "@/lib/checkout";

export async function POST(request: Request) {
  try {
    const { courseId, code } = await request.json();

    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json(
        { valid: false, message: "缺少課程編號", originalPrice: 0, finalPrice: 0, discountAmount: 0 },
        { status: 400 }
      );
    }

    const course = await getPublishedCourseById(courseId);

    if (!course) {
      return NextResponse.json(
        { valid: false, message: "找不到課程", originalPrice: 0, finalPrice: 0, discountAmount: 0 },
        { status: 404 }
      );
    }

    const originalPrice = course.price;
    const result = evaluateDiscount(originalPrice, code);

    return NextResponse.json(result, {
      status: result.valid ? 200 : 400,
    });
  } catch (error) {
    console.error("[discount] error:", error);
    return NextResponse.json(
      {
        valid: false,
        message: "套用折扣碼時發生錯誤，請稍後再試。",
        originalPrice: 0,
        finalPrice: 0,
        discountAmount: 0,
      },
      { status: 500 }
    );
  }
}
