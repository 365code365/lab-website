import '@/lib/antd-patch';
import type { Metadata } from "next";
import "./globals.css";
import "@/styles/modal.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ConfigProvider, App } from 'antd';
import theme from '@/config/antd-theme';
import zhCN from 'antd/locale/zh_CN';

export const metadata: Metadata = {
  title: "智能化药物研发加速器 - 课题组官网",
  description: "致力于利用人工智能和计算生物学技术，加速药物发现和开发过程",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className="antialiased min-h-screen flex flex-col font-sans"
      >
        <ConfigProvider theme={theme} locale={zhCN}>
          <App>
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </App>
        </ConfigProvider>
      </body>
    </html>
  );
}
