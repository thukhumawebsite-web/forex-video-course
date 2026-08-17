export default async function handler(req, res) {
  // POST Request သာ ခွင့်ပြုမည်
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { password, lessons, message } = req.body;

  // Password စစ်ဆေးခြင်း
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '001';
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid Admin Password' });
  }

  const GH_TOKEN = process.env.GH_TOKEN;
  const GH_OWNER = process.env.GH_OWNER;
  const GH_REPO = process.env.GH_REPO;
  const GH_PATH = process.env.GH_PATH || 'lessons.json';
  const GH_BRANCH = process.env.GH_BRANCH || 'main';

  if (!GH_TOKEN || !GH_OWNER || !GH_REPO) {
    return res.status(500).json({ message: 'Vercel Environment Variables are missing!' });
  }

  try {
    // 1. GitHub မှ လက်ရှိ File SHA ရယူခြင်း
    const getUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`;
    const getRes = await fetch(getUrl, {
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    let fileSha = null;
    if (getRes.ok) {
      const fileData = await getRes.json();
      fileSha = fileData.sha;
    }

    // 2. Base64 Encode လုပ်ပြီး GitHub သို့ Auto Commit ပို့ခြင်း
    const contentBase64 = Buffer.from(JSON.stringify(lessons, null, 2)).toString('base64');
    const putUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`;

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GH_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message || 'Update lessons via Web UI',
        content: contentBase64,
        sha: fileSha,
        branch: GH_BRANCH
      })
    });

    if (putRes.ok) {
      return res.status(200).json({ success: true, message: 'Successfully synced to GitHub!' });
    } else {
      const err = await putRes.json();
      return res.status(500).json({ message: err.message || 'Failed to commit to GitHub' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
