import {NextRequest, NextResponse} from 'next/server'
import {signV4Request, formatQuery} from "@/app/api/ai-image/index";
import * as fs from 'fs';
import * as path from 'path';


// 使用火山引擎即梦AI生成图片

export async function POST(request: NextRequest) {
    try {
        const {summary} = await request.json()

        if (!summary || typeof summary !== 'string') {
            return NextResponse.json(
                {error: '新闻摘要不能为空'},
                {status: 400}
            )
        }
        // 请求凭证，从访问控制申请
        const access_key = process.env.DOUBAO_ACCESS_KEY;
        const secret_key = process.env.DOUBAO_SECRET_KEY;
        const doubao_region = process.env.DOUBAO_REGION;

        // 请求Query，按照接口文档中填入即可
        const query_params: Record<string, string> = {
            'Action': 'CVProcess',
            'Version': '2024-06-06',
        };
        const formatted_query = await formatQuery(query_params);

        // 请求Body，按照接口文档中填入即可
        const body_params = {
            "req_key": "jimeng_high_aes_general_v21_L",
            "prompt": summary
        };
        const formatted_body = JSON.stringify(body_params);

        const res = await signV4Request(doubao_region || "", access_key || '', secret_key || '', 'cv', formatted_query || '', formatted_body);
        const binaryDataBase64 = JSON.parse(res)?.Result?.data?.binary_data_base64;
        let base64 = ""
        if (binaryDataBase64) {
            base64 = binaryDataBase64[0];
        }

        // 如果有base64数据，保存为文件
        if (base64) {
            // 确保uploads目录存在
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, {recursive: true});
            }

            // 生成唯一文件名
            const timestamp = Date.now();
            const randomNum = Math.floor(Math.random() * 10000);
            const filename = `ai-image-${timestamp}-${randomNum}.png`;
            const filePath = path.join(uploadsDir, filename);

            // 将base64数据解码并保存为文件
            const imageBuffer = Buffer.from(base64, 'base64');
            fs.writeFileSync(filePath, imageBuffer);

            // 返回文件的相对路径
            const relativePath = `/uploads/${filename}`;
            return NextResponse.json({
                success: true,
                imageUrl: relativePath
            });
        }

        return NextResponse.json({
            success: true,
            imageUrl: base64
        })

    } catch (error) {
        console.error('AI image generation error:', error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : '图片生成失败',
                details: error instanceof Error ? error.stack : undefined
            },
            {status: 500}
        )
    }
}