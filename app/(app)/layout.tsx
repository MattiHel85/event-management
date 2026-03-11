import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#f5f6fa] text-slate-900 min-h-screen">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 min-h-[calc(100vh-4rem)] ml-64 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
