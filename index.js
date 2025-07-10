require('dotenv').config();
const axios = require('axios');
const { parsePhoneNumber } = require('libphonenumber-js');

// ✅ Load API Keys from .env
const ROTABULL_API_KEY = process.env.ROTABULL_API_KEY;
const GHL_API_KEY = process.env.GHL_API_KEY;

// ✅ Format phone numbers properly
const formatPhone = (rawPhone) => {
  try {
    const phoneNumber = parsePhoneNumber(rawPhone);
    return phoneNumber.format('E.164'); // Example: +1234567890
  } catch {
    return null; // Invalid phone format
  }
};

// ✅ Main function
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
      const rawPhone = contact.phone || '';
      const phone = formatPhone(rawPhone);

      if (!email && !phone) {
        console.log(`🚫 Skipped: No email or valid phone: ${fullName}`);
        continue;
      }

      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      console.log(`➡️  Sending to GHL: ${email || 'No Email'} | ${firstName} ${lastName} | ${company} | ${phone || 'No Valid Phone'}`);

      await axios.post('https://rest.gohighlevel.com/v1/contacts/', {
        email,
        phone,
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

      console.log(`✅ Sent/Updated: ${email || phone}`);
    }

  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
};

// ✅ Run the function once
fetchRFQs();
