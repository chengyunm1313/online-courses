import Navbar from "@/components/Navbar";

const videos = [
  {
    id: "4mEddAUzzgk",
    title: "範例影片 1",
    embedUrl: "https://www.youtube.com/embed/4mEddAUzzgk",
    originalUrl: "https://youtu.be/4mEddAUzzgk?si=cjFDz6gLB-CcqAl0"
  },
  {
    id: "K2_lgpTThEw",
    title: "範例影片 2",
    embedUrl: "https://www.youtube.com/embed/K2_lgpTThEw",
    originalUrl: "https://youtu.be/K2_lgpTThEw?si=aKVgjqGAkyMiJcoP"
  },
  {
    id: "KHCHTCXGyug",
    title: "範例影片 3",
    embedUrl: "https://www.youtube.com/embed/KHCHTCXGyug",
    originalUrl: "https://youtu.be/KHCHTCXGyug?si=uhFxOiwwDLHrQ6C5"
  }
];

export default function VideoPreviewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">影片嵌入預覽</h1>
          <p className="text-gray-600">
            使用提供的 YouTube 連結，確認嵌入後的實際呈現效果
          </p>
        </div>

        <div className="space-y-12">
          {videos.map((video, index) => (
            <section key={video.id} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {video.title}
              </h2>
              <div
                className="w-full rounded-lg overflow-hidden shadow bg-black"
                style={{ aspectRatio: "16 / 9" }}
              >
                <iframe
                  src={`${video.embedUrl}?rel=0`}
                  title={`YouTube video player ${index + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <p className="text-sm text-gray-500 break-all">
                原始連結：{" "}
                <a
                  href={video.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  {video.originalUrl}
                </a>
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
