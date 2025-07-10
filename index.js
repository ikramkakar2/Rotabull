require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron'); // ⏱️ Added for scheduling

const ROTABULL_API_KEY = process.env.ROTABULL_API_KEY;
const GHL_API_KEY = process.env.GHL_API_KEY;

const fetchRFQs = async () => {
  try {
    console.log("🔁 Running task at", new Date().toLocaleTimeString());

    const response = await axios.get('https://app.rotabull.com/api/v1/deals', {
      headers: {
        'Authorization': `Bearer ${ROTABULL_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    console.log("✅ RFQs fetched from Rotabull");

    const deals = response.data.deals;

    for (const deal of deals) {
      const contact = deal.buyer_contact || {};
      const email = contact.email;
      const fullName = contact.name || '';
      const company = contact.company_name || 'Unknown Company';

      if (!email) {
        console.log(`🚫 Skipped: No email or phone: ${fullName}`);
        continue;
      }

      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      console.log(`➡️  Sending to GHL: ${email} | ${firstName} ${lastName} | ${company}`);

      await axios.post('https://rest.gohighlevel.com/v1/contacts/', {
        email,
        firstName,
        lastName,
        companyName: company,
        tags: ["rotabull"]
      }, {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Sent/Updated: ${email}`);
    }

  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

// ⏱️ Run fetchRFQs every 5 minutes
cron.schedule('*/5 * * * *', fetchRFQs);
