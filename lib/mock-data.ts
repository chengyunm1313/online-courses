import { Course } from "@/types/course";

/**
 * Mock data for development and testing
 * In production, this will be replaced with Firebase data
 */

const mockCourseSeed = [
  {
    id: "1",
    title: "完整 Web 開發入門：從零開始學習前端與後端",
    description: "這是一門全面的 Web 開發課程，涵蓋 HTML、CSS、JavaScript、React 和 Node.js。適合想要成為全端工程師的初學者。",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
    instructor: {
      id: "inst1",
      name: "skypassion5000@gmail.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ming",
      bio: "資深全端工程師，擁有 10 年以上開發經驗"
    },
    price: 1980,
    category: "程式開發",
    level: "beginner",
    duration: 40,
    lessons: 120,
    rating: 4.8,
    studentsEnrolled: 2340,
    syllabus: [
      {
        id: "s1-1",
        title: "Web 開發基礎介紹",
        description: "了解 Web 開發的基本概念和工具",
        duration: 45,
        order: 1
      },
      {
        id: "s1-2",
        title: "HTML & CSS 基礎",
        description: "學習網頁結構和樣式設計",
        duration: 120,
        order: 2
      },
      {
        id: "s1-3",
        title: "JavaScript 核心概念",
        description: "掌握 JavaScript 基礎語法和 DOM 操作",
        duration: 180,
        order: 3
      }
    ],
    modules: [
      {
        id: "module-1",
        title: "基礎觀念與版型",
        order: 1,
        lessons: [
          {
            id: "s1-1",
            title: "Web 開發基礎介紹",
            description: "了解 Web 開發的基本概念和工具",
            duration: 45,
            order: 1,
            preview: true
          },
          {
            id: "s1-2",
            title: "HTML & CSS 基礎",
            description: "學習網頁結構和樣式設計",
            duration: 120,
            order: 2,
            preview: true
          }
        ]
      },
      {
        id: "module-2",
        title: "JavaScript 進入門檻",
        order: 2,
        lessons: [
          {
            id: "s1-3",
            title: "JavaScript 核心概念",
            description: "掌握 JavaScript 基礎語法和 DOM 操作",
            duration: 180,
            order: 1,
            preview: false
          }
        ]
      }
    ],
    tags: ["Web開發", "前端", "後端", "全端"],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-10-01"),
    published: true
  },
  {
    id: "2",
    title: "Python 數據分析實戰：從基礎到進階",
    description: "學習使用 Python 進行數據分析，包括 Pandas、NumPy、Matplotlib 等重要套件的使用。",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    instructor: {
      id: "inst2",
      name: "skypassion5000@gmail.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jia",
      bio: "數據科學家，專精於機器學習和數據視覺化"
    },
    price: 2380,
    category: "數據科學",
    level: "intermediate",
    duration: 35,
    lessons: 85,
    rating: 4.9,
    studentsEnrolled: 1580,
    syllabus: [
      {
        id: "s2-1",
        title: "Python 基礎回顧",
        description: "快速複習 Python 核心語法",
        duration: 60,
        order: 1
      },
      {
        id: "s2-2",
        title: "Pandas 數據處理",
        description: "使用 Pandas 進行數據清理和轉換",
        duration: 150,
        order: 2
      }
    ],
    modules: [
      {
        id: "module-1",
        title: "Python 核心複習",
        order: 1,
        lessons: [
          {
            id: "s2-1",
            title: "Python 基礎回顧",
            description: "快速複習 Python 核心語法",
            duration: 60,
            order: 1,
            preview: true
          }
        ]
      },
      {
        id: "module-2",
        title: "資料前處理",
        order: 2,
        lessons: [
          {
            id: "s2-2",
            title: "Pandas 數據處理",
            description: "使用 Pandas 進行數據清理和轉換",
            duration: 150,
            order: 1
          }
        ]
      }
    ],
    tags: ["Python", "數據分析", "Pandas", "機器學習"],
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-09-15"),
    published: true
  },
  {
    id: "3",
    title: "UI/UX 設計實務：打造優質使用者體驗",
    description: "學習現代 UI/UX 設計原則，包括用戶研究、原型設計、可用性測試等完整設計流程。",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
    instructor: {
      id: "inst3",
      name: "skypassion5000@gmail.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mei",
      bio: "UI/UX 設計師，曾在多家科技公司擔任設計總監"
    },
    price: 1680,
    category: "設計",
    level: "beginner",
    duration: 28,
    lessons: 75,
    rating: 4.7,
    studentsEnrolled: 980,
    syllabus: [
      {
        id: "s3-1",
        title: "設計思維導論",
        description: "了解以用戶為中心的設計思維",
        duration: 50,
        order: 1
      },
      {
        id: "s3-2",
        title: "Figma 工具實戰",
        description: "學習使用 Figma 進行介面設計",
        duration: 120,
        order: 2
      }
    ],
    modules: [
      {
        id: "module-1",
        title: "設計思維核心",
        order: 1,
        lessons: [
          {
            id: "s3-1",
            title: "設計思維導論",
            description: "了解以用戶為中心的設計思維",
            duration: 50,
            order: 1,
            preview: true
          }
        ]
      },
      {
        id: "module-2",
        title: "設計工具上手",
        order: 2,
        lessons: [
          {
            id: "s3-2",
            title: "Figma 工具實戰",
            description: "學習使用 Figma 進行介面設計",
            duration: 120,
            order: 1
          }
        ]
      }
    ],
    tags: ["UI設計", "UX設計", "Figma", "使用者體驗"],
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-10-05"),
    published: true
  },
  {
    id: "4",
    title: "機器學習基礎：理論與實踐",
    description: "深入了解機器學習的核心概念，包括監督學習、非監督學習和深度學習入門。",
    thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800",
    instructor: {
      id: "inst4",
      name: "skypassion5000@gmail.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chen",
      bio: "AI 研究員，專注於深度學習和自然語言處理"
    },
    price: 3280,
    category: "人工智慧",
    level: "advanced",
    duration: 50,
    lessons: 110,
    rating: 4.9,
    studentsEnrolled: 1200,
    syllabus: [
      {
        id: "s4-1",
        title: "機器學習概述",
        description: "認識機器學習的基本概念和應用",
        duration: 60,
        order: 1
      }
    ],
    modules: [
      {
        id: "module-1",
        title: "機器學習基礎",
        order: 1,
        lessons: [
          {
            id: "s4-1",
            title: "機器學習概述",
            description: "認識機器學習的基本概念和應用",
            duration: 60,
            order: 1,
            preview: true
          }
        ]
      }
    ],
    tags: ["機器學習", "深度學習", "AI", "Python"],
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-09-20"),
    published: true
  },
  {
    id: "5",
    title: "React 與 Next.js 現代前端開發",
    description: "學習使用 React 和 Next.js 建立高效能的現代 Web 應用程式。",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
    instructor: {
      id: "inst1",
      name: "skypassion5000@gmail.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ming",
      bio: "資深全端工程師，擁有 10 年以上開發經驗"
    },
    price: 2180,
    category: "程式開發",
    level: "intermediate",
    duration: 32,
    lessons: 95,
    rating: 4.8,
    studentsEnrolled: 1890,
    syllabus: [
      {
        id: "s5-1",
        title: "React 核心概念",
        description: "深入理解 React 的組件、狀態和生命週期",
        duration: 90,
        order: 1
      }
    ],
    modules: [
      {
        id: "module-1",
        title: "React 核心",
        order: 1,
        lessons: [
          {
            id: "s5-1",
            title: "React 核心概念",
            description: "深入理解 React 的組件、狀態和生命週期",
            duration: 90,
            order: 1,
            preview: true
          }
        ]
      }
    ],
    tags: ["React", "Next.js", "前端開發", "JavaScript"],
    createdAt: new Date("2024-04-01"),
    updatedAt: new Date("2024-10-10"),
    published: true
  },
  {
    id: "6",
    title: "數位行銷完全指南：SEO、社群與廣告",
    description: "全面學習數位行銷策略，包括 SEO 優化、社群媒體經營和線上廣告投放。",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
  instructor: {
    id: "inst5",
    name: "skypassion5000@gmail.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ya",
    bio: "數位行銷專家，協助多家企業提升線上業績"
  },
    price: 1880,
    category: "行銷",
    level: "beginner",
    duration: 25,
    lessons: 68,
    rating: 4.6,
    studentsEnrolled: 1450,
    syllabus: [
      {
        id: "s6-1",
        title: "數位行銷基礎",
        description: "認識數位行銷的核心概念",
        duration: 55,
        order: 1
      }
    ],
    modules: [
      {
        id: "module-1",
        title: "行銷基礎概念",
        order: 1,
        lessons: [
          {
            id: "s6-1",
            title: "數位行銷基礎",
            description: "認識數位行銷的核心概念",
            duration: 55,
            order: 1,
            preview: true
          }
        ]
      }
    ],
    tags: ["數位行銷", "SEO", "社群媒體", "廣告"],
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-09-25"),
    published: true
  }
];

export const mockCourses: Course[] = mockCourseSeed.map((course) => ({
  ...course,
  subtitle: "",
  slug: course.id,
  ogImage: course.thumbnail,
  status: course.published ? "published" : "draft",
  originalPrice: course.price,
  salesMode: "evergreen",
  salesStatus: course.published ? "selling" : "draft",
  launchStartsAt: undefined,
  launchEndsAt: undefined,
  showCountdown: false,
  showSeats: false,
  seatLimit: undefined,
  soldCountMode: "enrollments",
  leadMagnetEnabled: false,
  leadMagnetTitle: undefined,
  leadMagnetDescription: undefined,
  leadMagnetCouponCode: undefined,
  priceLadders: [],
  targetAudience: [],
  learningOutcomes: [],
  faq: [],
  salesBlocks: [],
  seoTitle: course.title,
  seoDescription: course.description,
  level: course.level as Course["level"],
}));

export const categories = [
  "程式開發",
  "數據科學",
  "設計",
  "人工智慧",
  "行銷",
  "商業管理",
  "語言學習",
  "個人成長"
];

// Mock Orders Data
import { Order } from "@/types/order";

export const mockOrders: Order[] = [
  {
    id: "ORD-2024-001",
    userId: "user123",
    userName: "陳小明",
    userEmail: "chen@example.com",
    items: [
      {
        courseId: "1",
        courseTitle: "完整 Web 開發入門：從零開始學習前端與後端",
        courseThumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
        price: 1980,
        instructor: "skypassion5000@gmail.com"
      }
    ],
    subtotal: 1980,
    discountAmount: 0,
    tax: 99,
    total: 2079,
    status: "completed",
    paymentMethod: "credit_card",
    transactionId: "TXN-20240115-001",
    createdAt: new Date("2024-01-15T10:30:00"),
    updatedAt: new Date("2024-01-15T10:31:00"),
    completedAt: new Date("2024-01-15T10:31:00"),
    notes: "付款成功，課程已開通"
  },
  {
    id: "ORD-2024-002",
    userId: "user456",
    userName: "林美華",
    userEmail: "lin@example.com",
    items: [
      {
        courseId: "2",
        courseTitle: "Python 數據分析完整攻略：從入門到實戰應用",
        courseThumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
        price: 2480,
        instructor: "skypassion5000@gmail.com"
      },
      {
        courseId: "4",
        courseTitle: "機器學習與深度學習實戰：打造 AI 應用",
        courseThumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800",
        price: 3200,
        instructor: "skypassion5000@gmail.com"
      }
    ],
    subtotal: 5680,
    discountAmount: 0,
    tax: 284,
    total: 5964,
    status: "completed",
    paymentMethod: "paypal",
    transactionId: "TXN-20240118-002",
    createdAt: new Date("2024-01-18T14:20:00"),
    updatedAt: new Date("2024-01-18T14:22:00"),
    completedAt: new Date("2024-01-18T14:22:00")
  },
  {
    id: "ORD-2024-003",
    userId: "user789",
    userName: "王大偉",
    userEmail: "wang@example.com",
    items: [
      {
        courseId: "3",
        courseTitle: "UI/UX 設計實戰：從零開始成為設計師",
        courseThumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
        price: 2180,
        instructor: "skypassion5000@gmail.com"
      }
    ],
    subtotal: 2180,
    discountAmount: 0,
    tax: 109,
    total: 2289,
    status: "pending",
    paymentMethod: "bank_transfer",
    createdAt: new Date("2024-01-20T09:15:00"),
    updatedAt: new Date("2024-01-20T09:15:00"),
    notes: "等待銀行轉帳確認"
  },
  {
    id: "ORD-2024-004",
    userId: "user321",
    userName: "張小芳",
    userEmail: "zhang@example.com",
    items: [
      {
        courseId: "6",
        courseTitle: "數位行銷全攻略：從 SEO 到社群媒體經營",
        courseThumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
        price: 1880,
        instructor: "skypassion5000@gmail.com"
      }
    ],
    subtotal: 1880,
    discountAmount: 0,
    tax: 94,
    total: 1974,
    status: "completed",
    paymentMethod: "credit_card",
    transactionId: "TXN-20240122-003",
    createdAt: new Date("2024-01-22T16:45:00"),
    updatedAt: new Date("2024-01-22T16:46:00"),
    completedAt: new Date("2024-01-22T16:46:00")
  },
  {
    id: "ORD-2024-005",
    userId: "user654",
    userName: "李志強",
    userEmail: "li@example.com",
    items: [
      {
        courseId: "1",
        courseTitle: "完整 Web 開發入門：從零開始學習前端與後端",
        courseThumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
        price: 1980,
        instructor: "skypassion5000@gmail.com"
      },
      {
        courseId: "3",
        courseTitle: "UI/UX 設計實戰：從零開始成為設計師",
        courseThumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
        price: 2180,
        instructor: "skypassion5000@gmail.com"
      }
    ],
    subtotal: 4160,
    discountAmount: 0,
    tax: 208,
    total: 4368,
    status: "cancelled",
    paymentMethod: "credit_card",
    createdAt: new Date("2024-01-25T11:00:00"),
    updatedAt: new Date("2024-01-25T12:30:00"),
    notes: "用戶取消訂單"
  },
  {
    id: "ORD-2024-006",
    userId: "user987",
    userName: "黃雅婷",
    userEmail: "huang@example.com",
    items: [
      {
        courseId: "4",
        courseTitle: "機器學習與深度學習實戰：打造 AI 應用",
        courseThumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800",
        price: 3200,
        instructor: "skypassion5000@gmail.com"
      }
    ],
    subtotal: 3200,
    discountAmount: 0,
    tax: 160,
    total: 3360,
    status: "completed",
    paymentMethod: "credit_card",
    transactionId: "TXN-20240128-004",
    createdAt: new Date("2024-01-28T13:20:00"),
    updatedAt: new Date("2024-01-28T13:21:00"),
    completedAt: new Date("2024-01-28T13:21:00")
  }
];
