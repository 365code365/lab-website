import { LocaleProvider } from '@/contexts/LocaleContext';
import { ConfigProvider, App } from 'antd';
import theme from '@/config/antd-theme';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import '@/app/globals.css';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;
  
  // 直接导入消息文件
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    // 如果找不到对应语言文件，使用中文作为默认
    messages = (await import(`../../messages/zh.json`)).default;
  }
  
  const antdLocale = locale === 'en' ? enUS : zhCN;
  
  return (
    <html lang={locale}>
      <body className="antialiased min-h-screen flex flex-col font-sans">
        <ConfigProvider theme={theme} locale={antdLocale}>
          <App>
            <LocaleProvider locale={locale} messages={messages}>
              <Navigation />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </LocaleProvider>
          </App>
        </ConfigProvider>
      </body>
    </html>
  );
}