// 注意：我們拿掉了 "runtime: edge" 的設定，改用預設的 Node.js 環境，這樣讀取變數最穩定。

export default async function handler(req, res) {
    // 1. 檢查是否為 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ message: '只接受 POST 請求' });
    }

    try {
        // 2. 取得資料 (Node.js 模式下，req.body 會自動幫我們整理好資料)
        const { name, attendance, people, dietType, restrictions, noAlcohol, note } = req.body;

        // 3. 準備發送給 Notion 的資料
        const notionData = {
            parent: { database_id: process.env.NOTION_DATABASE_ID }, // 這裡一定讀得到了！
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
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('後端錯誤:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
