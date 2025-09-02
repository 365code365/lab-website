import * as crypto from 'crypto';

const method = 'POST';
const host = 'visual.volcengineapi.com';
const endpoint = 'https://visual.volcengineapi.com';
const service = 'cv';

function sign(key: Buffer, msg: string): Buffer {
    return crypto.createHmac('sha256', key).update(msg, 'utf8').digest();
}

function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
    const kDate = sign(Buffer.from(key, 'utf8'), dateStamp);
    const kRegion = sign(kDate, regionName);
    const kService = sign(kRegion, serviceName);
    const kSigning = sign(kService, 'request');
    return kSigning;
}

export function formatQuery(parameters: Record<string, string>): string {
    const sortedKeys = Object.keys(parameters).sort();
    const queryParts: string[] = [];

    for (const key of sortedKeys) {
        queryParts.push(`${key}=${parameters[key]}`);
    }

    return queryParts.join('&');
}

function sha256Hex(data: string): string {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

export async function signV4Request(region: string, access_key: string, secret_key: string, service: string, req_query: string, req_body: string): Promise<string> {
    if (!access_key || !secret_key) {
        console.log('No access key is available.');
        process.exit(1);
    }

    const t = new Date();
    const current_date = t.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/[-:]/g, '');
    const datestamp = t.toISOString().slice(0, 10).replace(/-/g, '');

    const canonical_uri = '/';
    const canonical_querystring = req_query;
    const signed_headers = 'content-type;host;x-content-sha256;x-date';
    const payload_hash = sha256Hex(req_body);
    const content_type = 'application/json';

    const canonical_headers = `content-type:${content_type}\nhost:${host}\nx-content-sha256:${payload_hash}\nx-date:${current_date}\n`;

    const canonical_request = `${method}\n${canonical_uri}\n${canonical_querystring}\n${canonical_headers}\n${signed_headers}\n${payload_hash}`;

    console.log('Canonical Request:');
    console.log(canonical_request);
    console.log('');

    const algorithm = 'HMAC-SHA256';
    const credential_scope = `${datestamp}/${region}/${service}/request`;
    const string_to_sign = `${algorithm}\n${current_date}\n${credential_scope}\n${sha256Hex(canonical_request)}`;

    console.log('String to Sign:');
    console.log(string_to_sign);
    console.log('');

    const signing_key = getSignatureKey(secret_key, datestamp, region, service);
    const signature = crypto.createHmac('sha256', signing_key).update(string_to_sign, 'utf8').digest('hex');

    console.log('Signature:', signature);
    console.log('');

    const authorization_header = `${algorithm} Credential=${access_key}/${credential_scope}, SignedHeaders=${signed_headers}, Signature=${signature}`;

    const headers = {
        'X-Date': current_date,
        'Authorization': authorization_header,
        'X-Content-Sha256': payload_hash,
        'Content-Type': content_type
    };

    const request_url = `${endpoint}?${canonical_querystring}`;

    console.log('BEGIN REQUEST++++++++++++++++++++++++++++++++++++');
    console.log('Request URL = ' + request_url);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Body:', req_body);

    try {
        const response = await fetch(request_url, {
            method: 'POST',
            headers: headers,
            body: req_body
        });

        console.log('\nRESPONSE++++++++++++++++++++++++++++++++++++');
        console.log(`Response code: ${response.status}\n`);

        const responseText = await response.text();
        const resp_str = responseText.replace(/\\u0026/g, "&");
        console.log(`Response body: ${resp_str}\n`);
        return resp_str
    } catch (error) {
        console.error(`Error occurred: ${error}`);
        throw error;
    }
}

async function main() {
    // 请求凭证，从访问控制申请
    const access_key = 'AKLTYjJiOThkZDZkMTUxNDJjM2E4YmViZGMyNzMzOTM4OWM';
    const secret_key = 'TnpnMlpUYzNOVGRpTURFMU5ERTVPV0poWW1VMlpUaGxZVGs0WldaaFpUSQ==';

    // 请求Query，按照接口文档中填入即可
    const query_params: Record<string, string> = {
        'Action': 'CVProcess',
        'Version': '2024-06-06',
    };
    const formatted_query = formatQuery(query_params);

    // 请求Body，按照接口文档中填入即可
    const body_params = {
        "req_key": "jimeng_high_aes_general_v21_L",
        "prompt": "狗仔"
    };
    const formatted_body = JSON.stringify(body_params);

    await signV4Request("cn-beijing",access_key, secret_key, service, formatted_query, formatted_body);
}


// 执行主函数
main().catch(console.error);