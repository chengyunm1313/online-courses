import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-gray-900 py-12 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">線上學院</h3>
            <p className="text-sm">
              提供優質的線上學習體驗，幫助每個人實現學習目標。
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">課程分類</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/courses?category=程式開發" className="hover:text-white">程式開發</Link></li>
              <li><Link href="/courses?category=數據科學" className="hover:text-white">數據科學</Link></li>
              <li><Link href="/courses?category=設計" className="hover:text-white">設計</Link></li>
              <li><Link href="/courses?category=行銷" className="hover:text-white">行銷</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">關於我們</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">關於平台</Link></li>
              <li><Link href="/contact" className="hover:text-white">聯絡我們</Link></li>
              <li><Link href="/terms" className="hover:text-white">使用條款</Link></li>
              <li><Link href="/privacy" className="hover:text-white">隱私政策</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">聯絡資訊</h4>
            <p className="text-sm">
              Email: chengyunm1313@gmail.com
              <br />
              服務時間: 週一至週五 10:00 - 18:00
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm">
          © 2026 線上學院. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
