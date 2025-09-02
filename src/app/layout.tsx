import '@/lib/antd-patch';
import type { Metadata } from "next";
import "./globals.css";
import "@/styles/modal.css";

export const metadata: Metadata = {
  title: "智能化药物研发加速器 - 课题组官网",
  description: "致力于利用人工智能和计算生物学技术，加速药物发现和开发过程",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}