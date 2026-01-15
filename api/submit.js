export const config = {
    runtime: 'edge', // 使用 Vercel Edge Function，速度快且簡單
};

export default async function handler(req) {
    // 1. 檢查是否為 POST 請求
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ message: '只接受 POST 請求' }), { status: 405 });
    }

    try {
        // 2. 取得前端傳來的資料
        const formData = await req.json();
        const { name, attendance, people, dietType, restrictions, noAlcohol, note } = formData;

        // 3. 準備發送給 Notion 的資料格式
        // 注意：這裡的欄位名稱 (如 "Name", "Attendance") 必須跟你 Notion 資料庫的「欄位標題」一模一樣
        const notionData = {
            parent: { database_id: process.env.NOTION_DATABASE_ID },
            properties: {
                "name": { title: [{ text: { content: name || "未命名" } }] },
                "attendance": { select: { name: attendance } },
                "people": { number: parseInt(people) || 1 },
                "dietType": { select: { name: dietType } },
                "restrictions": { rich_text: [{ text: { content: restrictions || "無" } }] },
                "noAlcohol": { select: { name: noAlcohol } },
                "note": { rich_text: [{ text: { content: note || "" } }] }
            }
        };

        // 4. 發送請求給 Notion API
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify(notionData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Notion API 錯誤');
        }

        // 5. 成功回傳
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
