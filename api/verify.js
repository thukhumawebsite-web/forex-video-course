export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { password } = req.body;
  const SITE_PASSWORD = process.env.SITE_PASSWORD || 'ask';

  if (password === SITE_PASSWORD) {
    return res.status(200).json({ success: true, message: 'Access granted' });
  } else {
    return res.status(401).json({ success: false, message: 'Invalid access password' });
  }
}
